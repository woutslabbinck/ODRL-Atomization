import { Quad, Term } from "@rdfjs/types";
import { DataFactory, Quad_Object, Store } from 'n3';
import { RDF, ODRL } from './util/Vocabulary';
import { extractAllRulesFromStore, ODRL_COMPACT_COMPOSITE_PREDICATES, POLICY_TYPES } from './util/util';

const { namedNode, quad } = DataFactory

export function atomizeCompositeRules(quads: Quad[]): Quad[] {
    const store = new Store(quads);
    const result = new Store(quads);

    const ruleSubjects = extractAllRulesFromStore(store)

    for (const rule of ruleSubjects) {
        const ruleQuads = store.getQuads(rule, null, null, null);
        const ruleType = store.getQuads(rule, RDF.terms.type, null, null).map(q => q.object);
        if (ruleType.length !== 1) throw Error(`${rule.value} has no type`);

        // create cartesian product of all shared properties
        const actions = store.getQuads(rule, ODRL.terms.action, null, null).map(q => q.object);
        const assigners = store.getQuads(rule, ODRL.terms.assigner, null, null).map(q => q.object);
        const assignees = store.getQuads(rule, ODRL.terms.assignee, null, null).map(q => q.object);
        const targets = store.getQuads(rule, ODRL.terms.target, null, null).map(q => q.object);

        // If any of the properties have more than one value, atomize the rule
        if (actions.length > 1 || assigners.length > 1 || assignees.length > 1 || targets.length > 1) {
            // Remove the full rule from the result if we're atomizing it
            ruleQuads.forEach(quad => result.removeQuad(quad));

            // Cartesian product of all combinations of action, assigner, assignee, target
            const cartesianProduct = calculateCartesianProduct({ actions, assigners, assignees, targets })

            // Check in the (updated) graph which policies/rules reference the current rule
            const references: Quad[] = findReferences(result, rule);

            // Create new rules for each combination
            cartesianProduct.forEach((properties) => {
                // Create a new unique rule ID using a proper UUID format (v4)
                const newRuleQuads: Quad[] = createNewRules({ quads: ruleQuads, ruleNode: rule, type: ruleType[0] }, properties, references);

                // remove all references
                result.removeQuads(references);
                result.addQuads(newRuleQuads);
            });
        }
    }


    return result.getQuads(null, null, null, null);
}

type QuadProperty = Quad_Object | undefined; // Action, Assigner, Assignee, or Target can be a string or null



/**
 * Creates a new rule based on the original rule, adding new properties and updating references.
 * 
 * @param originalRule - The original rule object, containing:
 *  - `quads`: The quads of the original rule.
 *  - `type`: The type of the original rule.
 *  - `ruleNode`: The node representing the original rule.
 * 
 * @param newProperties - The new properties to be added to the rule:
 *  - `action`: The new action for the rule.
 *  - `assigner`: The new assigner for the rule.
 *  - `assignee`: The new assignee for the rule.
 *  - `target`: The new target for the rule.
 * 
 * @param references - Quads that reference the original rule, which will be updated to point to the new rule.
 * 
 * @returns A list of quads representing the new rule, including all the necessary references.
 */
function createNewRules(
    originalRule: { quads: Quad[], type: Quad_Object, ruleNode: Term },
    newProperties: { action: QuadProperty, assigner: QuadProperty, assignee: QuadProperty, target: QuadProperty },
    references: Quad[]
): Quad[] {
    const { action, assigner, assignee, target } = newProperties;
    const { quads: ruleQuads, type, ruleNode: rule } = originalRule;
    const newRuleNamedNode = namedNode(`urn:uuid:${crypto.randomUUID()}`);
    // Create the new rule quads
    const newRuleQuads: Quad[] = [];

    // Get original properties (other than assignee, assigner, action, and target)
    const otherProperties = ruleQuads.filter(q => !ODRL_COMPACT_COMPOSITE_PREDICATES.has(q.predicate.value));

    // Add other properties to the new rule (excluding assignee, assigner, action, and target)
    otherProperties.forEach(q => {
        newRuleQuads.push(quad(newRuleNamedNode, q.predicate, q.object));
    });
    // Add triples for the new rule
    newRuleQuads.push(quad(newRuleNamedNode, RDF.terms.type, type));
    if (action) newRuleQuads.push(quad(newRuleNamedNode, ODRL.terms.action, action));
    if (assigner) newRuleQuads.push(quad(newRuleNamedNode, ODRL.terms.assigner, assigner));
    if (assignee) newRuleQuads.push(quad(newRuleNamedNode, ODRL.terms.assignee, assignee));
    if (target) newRuleQuads.push(quad(newRuleNamedNode, ODRL.terms.target, target));

    // Add a triple to point back to the original rule (derived from)
    newRuleQuads.push(quad(newRuleNamedNode, namedNode('http://example.org/ns/derivedFrom'), namedNode(rule.value)));

    // Add all references to point to the new quad
    references.forEach(q => {
        newRuleQuads.push(quad(q.subject, q.predicate, newRuleNamedNode));
    });
    return newRuleQuads;
}

// Input and output object type definition
interface CartesianInput {
    actions: QuadProperty[];
    assignees: QuadProperty[];
    assigners: QuadProperty[];
    targets: QuadProperty[];
}

interface CartesianOutput {
    action: QuadProperty;
    assigner: QuadProperty;
    assignee: QuadProperty;
    target: QuadProperty;
}

/**
 * Generates a Cartesian product of actions, assignees, assigners, and targets.
 * If any property is missing, it's treated as a wildcard (undefined).
 * 
 * @param input - Arrays of actions, assignees, assigners, and targets.
 * @returns - An array of all possible combinations.
 */
function calculateCartesianProduct(input: CartesianInput): CartesianOutput[] {
    const { actions, assignees, assigners, targets } = input;

    // Handle missing properties by treating them as a single "wildcard" value (undefined)
    if (actions.length === 0) actions.push(undefined);
    if (assigners.length === 0) assigners.push(undefined);
    if (assignees.length === 0) assignees.push(undefined);
    if (targets.length === 0) targets.push(undefined);

    const result: CartesianOutput[] = [];

    // Create the Cartesian product of all combinations of action, assigner, assignee, target
    for (const action of actions) {
        for (const assigner of assigners) {
            for (const assignee of assignees) {
                for (const target of targets) {
                    result.push({ action, assigner, assignee, target });
                }
            }
        }
    }

    return result;
}


/**
 * Utility function to find references of a rule in the graph.
 * This searches for quads where the rule is used as the object for specific ODRL properties.
 * 
 * @param store - The N3 store to search within.
 * @param rule - The rule (subject) to find references for.
 * @returns An array of quads that reference the given rule.
 */
function findReferences(store: Store, rule: Term): Quad[] {
    const references: Quad[] = [];

    // Define the list of ODRL properties that may reference the rule
    const referenceProperties = [
        ODRL.terms.permission,
        ODRL.terms.prohibition,
        ODRL.terms.obligation,
        ODRL.terms.duty,
        ODRL.terms.consequence,
        ODRL.terms.remedy
    ];

    // Search for quads where the rule is used as the object for each of the reference properties
    referenceProperties.forEach(property => {
        const refs = store.getQuads(null, property, rule, null);
        refs.forEach(q => references.push(q));
    });

    return references;
}