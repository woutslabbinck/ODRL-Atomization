import { Quad } from '@rdfjs/types'
import { DataFactory, Store } from 'n3'
import { atomizeCompositeRules, ODRL, RDF } from '../../src/'
import 'jest-rdf';
import { DERIVED_FROM, TEST } from '../util/Util';
const { namedNode, quad } = DataFactory;

describe('The Atomize Composite Rules function', () => {

    // rule with all properties
    let rule: Quad[];

    let policy: Quad[];
    beforeEach(() => {
        rule = [
            quad(TEST.terms.permission1, RDF.terms.type, ODRL.terms.Permission),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.permission1, ODRL.terms.assignee, TEST.terms.party),
            quad(TEST.terms.permission1, ODRL.terms.assigner, TEST.terms.party)
        ]

        policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),
            ...rule
        ]
    })

    test('does nothing when there is no composite rule.', () => {
        expect(atomizeCompositeRules(rule)).toBeRdfIsomorphic(rule)
        expect(atomizeCompositeRules(policy)).toBeRdfIsomorphic(policy)
    })

    const RULE_TYPES = [
        { label: 'permission', term: ODRL.terms.Permission },
        { label: 'prohibition', term: ODRL.terms.Prohibition },
        { label: 'duty', term: ODRL.terms.Duty },
    ];

    for (const { label, term } of RULE_TYPES) {

        test(`atomizes a ${label} rule with two assignees into two derived rules.`, () => {
            const extraAssignee = namedNode(TEST.namespace + "anotherParty")
            rule.shift()
            rule.push(
                quad(TEST.terms.permission1, RDF.terms.type, term),
                quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee)
            )

            const resultStore = new Store(atomizeCompositeRules(rule));
            const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
            expect(derivedFromQuads).toHaveLength(2);

            const derivedRules = derivedFromQuads.map(q => q.subject);

            for (const derivedRule of derivedRules) {
                const assignees = resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null);
                expect(assignees).toHaveLength(1);
            }

            const assigneeObjects = resultStore
                .getQuads(null, ODRL.terms.assignee, null, null)
                .map(q => q.object.value);

            expect(new Set(assigneeObjects)).toEqual(new Set([
                TEST.terms.party.value,
                extraAssignee.value,
            ]));

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, RDF.terms.type, term, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, TEST.terms.party, null)).toHaveLength(1);
            }
        })
    }



    test('atomizes a rule with two assignees into two derived rules.', () => {
        const extraAssignee = namedNode(TEST.namespace + "anotherParty")
        rule.push(
            quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee)
        )
        const resultStore = new Store(atomizeCompositeRules(rule));

        const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
        expect(derivedFromQuads).toHaveLength(2);

        const derivedRules = derivedFromQuads.map(q => q.subject);

        for (const derivedRule of derivedRules) {
            const assignees = resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null);
            expect(assignees).toHaveLength(1);
        }

        const assigneeObjects = resultStore
            .getQuads(null, ODRL.terms.assignee, null, null)
            .map(q => q.object.value);

        expect(new Set(assigneeObjects)).toEqual(new Set([TEST.terms.party.value, extraAssignee.value,]));

        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, RDF.terms.type, ODRL.terms.Permission, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, TEST.terms.party, null)).toHaveLength(1);
        }
    })

    test('atomizes a rule with two assigners into two derived rules.', () => {
        const extraAssigner = namedNode(TEST.namespace + "anotherAssigner")
        rule.push(
            quad(TEST.terms.permission1, ODRL.terms.assigner, extraAssigner)
        )
        const resultStore = new Store(atomizeCompositeRules(rule));

        const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
        expect(derivedFromQuads).toHaveLength(2);

        const derivedRules = derivedFromQuads.map(q => q.subject);

        for (const derivedRule of derivedRules) {
            const assigners = resultStore.getQuads(derivedRule, ODRL.terms.assigner, null, null);
            expect(assigners).toHaveLength(1);
        }

        const assignerObjects = resultStore
            .getQuads(null, ODRL.terms.assigner, null, null)
            .map(q => q.object.value);

        expect(new Set(assignerObjects)).toEqual(new Set([TEST.terms.party.value, extraAssigner.value,]));

        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, RDF.terms.type, ODRL.terms.Permission, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, TEST.terms.party, null)).toHaveLength(1);
        }
    })

    test('atomizes a rule with two actions into two derived rules.', () => {
        rule.push(
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.write)
        )
        const resultStore = new Store(atomizeCompositeRules(rule));

        const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
        expect(derivedFromQuads).toHaveLength(2);

        const derivedRules = derivedFromQuads.map(q => q.subject);

        for (const derivedRule of derivedRules) {
            const actions = resultStore.getQuads(derivedRule, ODRL.terms.action, null, null);
            expect(actions).toHaveLength(1);
        }

        const actionObjects = resultStore
            .getQuads(null, ODRL.terms.action, null, null)
            .map(q => q.object.value);

        expect(new Set(actionObjects)).toEqual(new Set([ODRL.terms.read.value, ODRL.terms.write.value,]));

        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, RDF.terms.type, ODRL.terms.Permission, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, TEST.terms.party, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, TEST.terms.party, null)).toHaveLength(1);
        }
    })

    test('atomizes a rule with two targets into two derived rules.', () => {
        const extraTarget = namedNode(TEST.namespace + "anotherAsset")
        rule.push(
            quad(TEST.terms.permission1, ODRL.terms.target, extraTarget)
        )
        const resultStore = new Store(atomizeCompositeRules(rule));

        const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
        expect(derivedFromQuads).toHaveLength(2);

        const derivedRules = derivedFromQuads.map(q => q.subject);

        for (const derivedRule of derivedRules) {
            const targets = resultStore.getQuads(derivedRule, ODRL.terms.target, null, null);
            expect(targets).toHaveLength(1);
        }

        const targetObjects = resultStore
            .getQuads(null, ODRL.terms.target, null, null)
            .map(q => q.object.value);

        expect(new Set(targetObjects)).toEqual(new Set([TEST.terms.asset.value, extraTarget.value,]));

        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, RDF.terms.type, ODRL.terms.Permission, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, TEST.terms.party, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, TEST.terms.party, null)).toHaveLength(1);
        }
    })

    test('atomizes a rule with two of each properties into all possible derived rules', () => {
        const extraAssignee = namedNode(TEST.namespace + "anotherParty")
        const extraAssigner = namedNode(TEST.namespace + "anotherAssigner")
        const extraAction = ODRL.terms.write
        const extraTarget = namedNode(TEST.namespace + "anotherAsset")

        rule.push(
            quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee),
            quad(TEST.terms.permission1, ODRL.terms.assigner, extraAssigner),
            quad(TEST.terms.permission1, ODRL.terms.action, extraAction),
            quad(TEST.terms.permission1, ODRL.terms.target, extraTarget),
        )

        const resultStore = new Store(atomizeCompositeRules(rule));

        const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
        const derivedRules = derivedFromQuads.map(q => q.subject);

        expect(derivedFromQuads).toHaveLength(16);
        expect(resultStore.getQuads(null, ODRL.terms.assignee, TEST.terms.party, null)).toHaveLength(8);
        expect(resultStore.getQuads(null, ODRL.terms.assignee, extraAssignee, null)).toHaveLength(8);

        expect(resultStore.getQuads(null, ODRL.terms.assigner, TEST.terms.party, null)).toHaveLength(8);
        expect(resultStore.getQuads(null, ODRL.terms.assigner, extraAssigner, null)).toHaveLength(8);

        expect(resultStore.getQuads(null, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(8);
        expect(resultStore.getQuads(null, ODRL.terms.action, extraAction, null)).toHaveLength(8);

        expect(resultStore.getQuads(null, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(8);
        expect(resultStore.getQuads(null, ODRL.terms.target, extraTarget, null)).toHaveLength(8);

        // each derived rule has proper cardinality (exactly 1 of each property)
        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, null, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.action, null, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedRule, ODRL.terms.target, null, null)).toHaveLength(1);
        }
    })

    test('relinks policies to all derived rules and removes links to the original rule', () => {
        const extraAssignee = namedNode(TEST.namespace + "anotherParty")
        policy.push(quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee))
        const resultStore = new Store(atomizeCompositeRules(policy));

        // policy must no longer link to the original rule
        expect(resultStore.getQuads(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1, null)).toHaveLength(0);

        // policy must link to all derived rules
        const policyPermissionLinks = resultStore.getQuads(TEST.terms.policy1, ODRL.terms.permission, null, null);
        expect(policyPermissionLinks).toHaveLength(2);

        const derivedRules = policyPermissionLinks.map(q => q.object);

        // every linked rule must be derived from the original rule
        for (const derivedRule of derivedRules) {
            expect(resultStore.getQuads(derivedRule, DERIVED_FROM, TEST.terms.permission1, null)).toHaveLength(1);
        }
    })

    const NESTED_RULE_CASES = [
        {
            label: 'permission to duty',
            ruleType: ODRL.terms.Duty,
            relation: ODRL.terms.duty,
        },
        {
            label: 'prohibition to duty',
            ruleType: ODRL.terms.Prohibition,
            relation: ODRL.terms.remedy,
        },
        {
            label: 'duty to duty',
            ruleType: ODRL.terms.Duty,
            relation: ODRL.terms.consequence,
        },
    ];

    for (const { label, ruleType, relation } of NESTED_RULE_CASES) {

        test(`relinks nested rules for ${label} and removes links to the original rule`, () => {
            const extraAssignee = namedNode(TEST.namespace + "anotherParty")
            const nestedRule = [
                quad(TEST.terms.permission1, RDF.terms.type, ruleType),
                quad(TEST.terms.permission1, relation, TEST.terms.duty1),

                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty),
                quad(TEST.terms.duty1, ODRL.terms.action, ODRL.terms.read),
                quad(TEST.terms.duty1, ODRL.terms.target, TEST.terms.asset),
                quad(TEST.terms.duty1, ODRL.terms.assignee, TEST.terms.party),
                quad(TEST.terms.duty1, ODRL.terms.assigner, TEST.terms.party),
                quad(TEST.terms.duty1, ODRL.terms.assignee, extraAssignee),
            ]

            const resultStore = new Store(atomizeCompositeRules(nestedRule));

            expect(resultStore.getQuads(TEST.terms.permission1, relation, TEST.terms.duty1, null)).toHaveLength(0);

            const linksToDuty = resultStore.getQuads(TEST.terms.permission1, relation, null, null);
            expect(linksToDuty).toHaveLength(2);

            const derivedRules = linksToDuty.map(q => q.object);

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, DERIVED_FROM, TEST.terms.duty1, null)).toHaveLength(1);
            }
        })
    }

    describe('handles missing properties by wildcarding to undefined', () => {


        test('works when action is missing (wildcard action)', () => {
            const extraAssignee = namedNode(TEST.namespace + "anotherParty")
            rule = rule.filter(q => !q.predicate.equals(ODRL.terms.action))
            rule.push(
                quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee)
            )

            const resultStore = new Store(atomizeCompositeRules(rule));
            const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
            expect(derivedFromQuads).toHaveLength(2);

            const derivedRules = derivedFromQuads.map(q => q.subject);

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.action, null, null)).toHaveLength(0);
            }
        })

        test('works when assigner is missing (wildcard assigner)', () => {
            const extraAssignee = namedNode(TEST.namespace + "anotherParty")
            rule = rule.filter(q => !q.predicate.equals(ODRL.terms.assigner))
            rule.push(
                quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee)
            )

            const resultStore = new Store(atomizeCompositeRules(rule));
            const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
            expect(derivedFromQuads).toHaveLength(2);

            const derivedRules = derivedFromQuads.map(q => q.subject);

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assigner, null, null)).toHaveLength(0);
            }
        })

        test('works when assignee is missing (wildcard assignee)', () => {
            rule = rule.filter(q => !q.predicate.equals(ODRL.terms.assignee))
            rule.push(
                quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.write)
            )

            const resultStore = new Store(atomizeCompositeRules(rule));
            const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
            expect(derivedFromQuads).toHaveLength(2);

            const derivedRules = derivedFromQuads.map(q => q.subject);

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, ODRL.terms.action, null, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null)).toHaveLength(0);
            }
        })

        test('works when target is missing (wildcard target)', () => {
            const extraAssignee = namedNode(TEST.namespace + "anotherParty")
            rule = rule.filter(q => !q.predicate.equals(ODRL.terms.target))
            rule.push(
                quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee)
            )

            const resultStore = new Store(atomizeCompositeRules(rule));
            const derivedFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.permission1, null);
            expect(derivedFromQuads).toHaveLength(2);

            const derivedRules = derivedFromQuads.map(q => q.subject);

            for (const derivedRule of derivedRules) {
                expect(resultStore.getQuads(derivedRule, ODRL.terms.assignee, null, null)).toHaveLength(1);
                expect(resultStore.getQuads(derivedRule, ODRL.terms.target, null, null)).toHaveLength(0);
            }
        })
    })
});