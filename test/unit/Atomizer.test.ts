import { Quad } from '@rdfjs/types'
import { DataFactory, Store } from 'n3'
import { Atomizer, ODRL, RDF } from '../../src'
import 'jest-rdf';
import { DERIVED_FROM, TEST } from '../util/Util';
const { namedNode, quad } = DataFactory;

describe('The Atomize class', () => {
    test('does nothing at all when the policy is not compact and the rules are not composite.', async () => {
        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            quad(TEST.terms.permission1, RDF.terms.type, ODRL.terms.Permission),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
        ]

        expect(await new Atomizer().atomize(policy)).toBeRdfIsomorphic(policy)
    })

    test('atomizes compact policies with composite rules (while handling refences correctly).', async () => {
        const extraAssignee = namedNode(TEST.namespace + "anotherParty")
        const policyAssigner = namedNode(TEST.namespace + "policyAssigner")

        const policy: Quad[] = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.assigner, policyAssigner),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            quad(TEST.terms.permission1, RDF.terms.type, ODRL.terms.Permission),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.permission1, ODRL.terms.assignee, TEST.terms.party),
            quad(TEST.terms.permission1, ODRL.terms.assignee, extraAssignee),
            quad(TEST.terms.permission1, ODRL.terms.duty, TEST.terms.duty1),

            quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty),
            quad(TEST.terms.duty1, ODRL.terms.action, ODRL.terms.delete),
            quad(TEST.terms.duty1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.duty1, ODRL.terms.assignee, TEST.terms.party),
            quad(TEST.terms.duty1, ODRL.terms.assignee, extraAssignee),
        ]

        // NOTE: adjust to your actual class + method name
        const resultStore = new Store(await new Atomizer().atomize(policy));

        expect(resultStore.getQuads(TEST.terms.policy1, ODRL.terms.assigner, policyAssigner, null)).toHaveLength(0);

        expect(resultStore.getQuads(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1, null)).toHaveLength(0);

        const policyPermissionLinks = resultStore.getQuads(TEST.terms.policy1, ODRL.terms.permission, null, null);
        expect(policyPermissionLinks).toHaveLength(2);

        const derivedPermissions = policyPermissionLinks.map(q => q.object);

        for (const derivedPermission of derivedPermissions) {
            expect(resultStore.getQuads(derivedPermission, DERIVED_FROM, TEST.terms.permission1, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedPermission, ODRL.terms.assignee, null, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedPermission, ODRL.terms.assigner, policyAssigner, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedPermission, ODRL.terms.action, ODRL.terms.read, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedPermission, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
        }

        expect(resultStore.getQuads(TEST.terms.permission1, ODRL.terms.duty, TEST.terms.duty1, null)).toHaveLength(0);

        const derivedDutyFromQuads = resultStore.getQuads(null, DERIVED_FROM, TEST.terms.duty1, null);
        expect(derivedDutyFromQuads).toHaveLength(2);

        const derivedDuties = derivedDutyFromQuads.map(q => q.subject);

        for (const derivedDuty of derivedDuties) {
            expect(resultStore.getQuads(derivedDuty, RDF.terms.type, ODRL.terms.Duty, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedDuty, ODRL.terms.assignee, null, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedDuty, ODRL.terms.assigner, policyAssigner, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedDuty, ODRL.terms.action, ODRL.terms.delete, null)).toHaveLength(1);
            expect(resultStore.getQuads(derivedDuty, ODRL.terms.target, TEST.terms.asset, null)).toHaveLength(1);
        }

        for (const derivedPermission of derivedPermissions) {
            expect(resultStore.getQuads(derivedPermission, ODRL.terms.duty, null, null)).toHaveLength(2);
            for (const derivedDuty of derivedDuties) {
                expect(resultStore.getQuads(derivedPermission, ODRL.terms.duty, derivedDuty, null)).toHaveLength(1);
            }
        }
    })
})