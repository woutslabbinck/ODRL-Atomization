import { Store } from 'n3';
import { Term } from '@rdfjs/types';
import { ODRL, RDF } from './Vocabulary';

/**
 * Extract all ODRL rule identifiers from a policy, including nested ones,
 * strictly following the ODRL rule introduction model.
 */
export function extractAllRulesFromPolicy(
  policy: Term,
  store: Store
): Set<Term> {
  const visited = new Set<string>();
  const rules = new Set<Term>();

  function visit(rule: Term): void {
    if (visited.has(rule.value)) return;

    visited.add(rule.value);
    rules.add(rule);

    // Nested rule relations (ODRL‑correct only)
    const nestedRelations = [
      ODRL.duty,         // Permission → Duty
      ODRL.remedy,       // Prohibition → Duty
      ODRL.consequence,  // Duty → Duty
    ];

    for (const predicate of nestedRelations) {
      const quads = store.getQuads(rule, predicate, null, null);
      for (const q of quads) {
        visit(q.object);
      }
    }
  }

  // Top‑level rules introduced by the policy
  const topLevelPredicates = [
    ODRL.permission,
    ODRL.prohibition,
    ODRL.obligation,
  ];

  for (const predicate of topLevelPredicates) {
    const quads = store.getQuads(policy, predicate, null, null);
    for (const q of quads) {
      visit(q.object);
    }
  }

  return rules;
}


/**
 * Extract all ODRL rules based purely on rdf:type.
 * 
 */
export function extractAllRulesFromStore(store: Store): Set<Term> {
  const rules = new Set<Term>();

  const ruleTypes = [
    ODRL.terms.Permission,
    ODRL.terms.Prohibition,
    ODRL.terms.Duty,
  ];

  for (const type of ruleTypes) {
    const quads = store.getQuads(null, RDF.type, type, null);
    for (const q of quads) {
      rules.add(q.subject);
    }
  }

  return rules;
}

export const POLICY_TYPES: Set<string> = new Set([
    ODRL.Policy,
    ODRL.Agreement,
    ODRL.Assertion,
    ODRL.Offer,
    ODRL.Privacy,
    ODRL.Request,
    ODRL.Set,
    ODRL.Ticket,
]);

export const ODRL_COMPACT_COMPOSITE_PREDICATES: Set<string>  = new Set([
    ODRL.target,
    ODRL.assigner,
    ODRL.assignee,
    ODRL.action,
]);