import { Quad } from "@rdfjs/types";
import { DataFactory, Store } from 'n3';
import { RDF } from './util/Vocabulary';
import { extractAllRulesFromPolicy, POLICY_TYPES, ODRL_COMPACT_COMPOSITE_PREDICATES } from './util/util';

/**
 * Atomizes ODRL Compact Policies (ODRL v2 §2.7.1)
 * 
 * Copies policy-level shared properties (e.g. target, assigner, assignee, action)
 * to all rules belonging to the policy and removes those properties from the
 * policy node. Rule-level values always take precedence.
 *
 * @param quads RDF quads containing one or more ODRL policies
 * @returns Quads where compact policies are expanded into atomic rules
 */
export function atomizeCompactPolicies(quads: Quad[]): Quad[] {
    const store = new Store(quads);
    const result = new Store(quads);


    // Find policy nodes
    const policySubjects = store
        .getQuads(null, RDF.type, null, null)
        .filter(q => POLICY_TYPES.has(q.object.value))
        .map(q => q.subject);

    for (const policy of policySubjects) {
        // Shared policy-level properties
        const sharedProps = store
            .getQuads(policy, null, null, null)
            .filter(q => ODRL_COMPACT_COMPOSITE_PREDICATES.has(q.predicate.value));

        if (sharedProps.length === 0) continue;

        // Rule links from policy
        const ruleSubjects = extractAllRulesFromPolicy(policy, store)

        for (const rule of ruleSubjects) {
            // Replicate shared properties to rule
            for (const sp of sharedProps) {
                result.addQuad(DataFactory.namedNode(rule.value), sp.predicate, sp.object, undefined);
            }
        }

        // Remove shared properties from the policy itself
        for (const sp of sharedProps) {
            result.removeQuad(sp);
        }
    }

    return result.getQuads(null, null, null, null);
}

