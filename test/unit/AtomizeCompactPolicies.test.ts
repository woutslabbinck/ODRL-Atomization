import { Quad } from '@rdfjs/types'
import { DataFactory, Store } from 'n3'
import { createVocabulary } from 'rdf-vocabulary';
import { atomizeCompactPolicies, ODRL, RDF } from '../../src/'
import 'jest-rdf';
const { namedNode, quad } = DataFactory;

// deliberatly placed here
const POLICY_TYPES: Set<string> = new Set([
    ODRL.Policy,
    ODRL.Agreement,
    ODRL.Assertion,
    ODRL.Offer,
    ODRL.Privacy,
    ODRL.Request,
    ODRL.Set,
    ODRL.Ticket,
]);

const ELEVATED_PROPERTIES = [
    ODRL.terms.action,
    ODRL.terms.target,
    ODRL.terms.assignee,
    ODRL.terms.assigner,
];


export const TEST = createVocabulary(
    'http://example.org/',
    'policy1',
    'permission1',
    'prohibition1',
    'duty1',
    'asset',
    'party'
);
describe('The Atomize Compact Policies function', () => {

    let policy: Quad[];
    // compact policy with one rule
    let compactPolicy: Quad[];
    const elevatedProperty = quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party)
    const ruleProperty = quad(TEST.terms.permission1, ODRL.terms.assignee, TEST.terms.party)
    beforeEach(() => {

        policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            quad(TEST.terms.permission1, RDF.terms.type, ODRL.terms.Permission),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
        ]
        compactPolicy = [
            ...policy, elevatedProperty
        ]
    })
    describe('for the policy classes:', () => {

        for (const type of POLICY_TYPES) {

            test(`atomizes the ${type} correctly.`, () => {
                compactPolicy.shift()
                compactPolicy.push(quad(TEST.terms.policy1, RDF.terms.type, namedNode(type)))
                const expected = new Store([...compactPolicy])
                expected.removeQuads([elevatedProperty])

                expected.addQuads([ruleProperty])
                expect(atomizeCompactPolicies(compactPolicy)).toBeRdfIsomorphic(expected)
            })
        }

        test('Does nothing when there is no policy class', () => {
            compactPolicy.shift()
            expect(atomizeCompactPolicies(compactPolicy)).toBeRdfIsomorphic(compactPolicy)

        })
    })
    test('does nothing when it is no elevated property in the policy.', () => {
        const policy = new Store(compactPolicy);
        policy.removeQuad(elevatedProperty)
        expect(atomizeCompactPolicies(policy.getQuads(null, null, null, null))).toBeRdfIsomorphic(policy)

    })

    describe('for the properties:', () => {
        for (const property of ELEVATED_PROPERTIES) {
            test(`propagates elevated policy ${property.value} to the rule`, () => {
                const elevated = quad(
                    TEST.terms.policy1,
                    property,
                    property === ODRL.terms.action
                        ? ODRL.terms.read
                        : TEST.terms.party
                );

                const policyWithElevation = [
                    ...policy,
                    elevated,
                ];

                const expected = [
                    ...policy,
                    quad(TEST.terms.permission1, property, elevated.object)
                ]

                expect(atomizeCompactPolicies(policyWithElevation)).toBeRdfIsomorphic(expected);
            });
        }

        test('propagates all elevated policy properties to the rule', () => {
            const elevatedQuads = [
                quad(TEST.terms.policy1, ODRL.terms.action, ODRL.terms.read),
                quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
                quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party),
                quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.party),
            ];

            const policyWithAllElevated = [
                ...policy,
                ...elevatedQuads,
            ];

            const expected = [...policy]

            for (const q of elevatedQuads) {
                expected.push(quad(TEST.terms.permission1, q.predicate, q.object));
            }

            expect(atomizeCompactPolicies(policyWithAllElevated)).toBeRdfIsomorphic(expected);
        });

    })

    describe('for rules:', () => {

        test('propagates elevated policy properties to nested rules (Permission → Duty).', () => {
            compactPolicy.push(
                quad(TEST.terms.permission1, ODRL.terms.duty, TEST.terms.duty1),

                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty),
                quad(TEST.terms.duty1, ODRL.terms.action, ODRL.terms.delete)
            )


            const expected = new Store(compactPolicy);

            // policy-level assignee must be removed
            expected.removeQuad(elevatedProperty);

            // and copied to *all* rules, including nested ones
            expected.addQuads([
                quad(TEST.terms.permission1, elevatedProperty.predicate, elevatedProperty.object),
                quad(TEST.terms.duty1, elevatedProperty.predicate, elevatedProperty.object),
            ]);

            expect(atomizeCompactPolicies(compactPolicy)).toBeRdfIsomorphic(expected);

        });

        test('propagates elevated policy properties to all types of rules.',() => {
            compactPolicy.push(
                quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.prohibition1),
                quad(TEST.terms.policy1, ODRL.terms.obligation, TEST.terms.duty1),

                quad(TEST.terms.prohibition1, RDF.terms.type, ODRL.terms.Prohibition),
                quad(TEST.terms.prohibition1, ODRL.terms.action, ODRL.terms.read),
                quad(TEST.terms.prohibition1, ODRL.terms.target, TEST.terms.asset),


                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty),
                quad(TEST.terms.duty1, ODRL.terms.action, ODRL.terms.delete),
                quad(TEST.terms.duty1, ODRL.terms.target, TEST.terms.asset),
            )
            const expected = new Store(compactPolicy);

            // policy-level assignee must be removed
            expected.removeQuad(elevatedProperty);

            // and copied to *all* rules
            expected.addQuads([
                quad(TEST.terms.permission1, elevatedProperty.predicate, elevatedProperty.object),
                quad(TEST.terms.prohibition1, elevatedProperty.predicate, elevatedProperty.object),
                quad(TEST.terms.duty1, elevatedProperty.predicate, elevatedProperty.object),
            ]);

            expect(atomizeCompactPolicies(compactPolicy)).toBeRdfIsomorphic(expected);
        })
    })


})

