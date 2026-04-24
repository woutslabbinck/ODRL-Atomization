import { DataFactory } from 'n3';
import { createVocabulary } from "rdf-vocabulary";
import { ODRL } from "../../src/util/Vocabulary";

const { namedNode, quad } = DataFactory;

// deliberatly placed here
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

export const ELEVATED_PROPERTIES = [
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

export const DERIVED_FROM = namedNode('http://example.org/ns/derivedFrom');
