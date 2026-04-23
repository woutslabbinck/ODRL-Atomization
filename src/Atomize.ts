import { Quad } from "@rdfjs/types";
import { atomizeCompactPolicies } from "./AtomizeCompactPolicies";
import { atomizeCompositeRules } from "./AtomizeCompositeRules";


export interface IAtomizer {
    evaluate(quads: Quad[]): Promise<Quad[]>
}

export class Atomizer implements IAtomizer {
    public constructor(){

    }
    evaluate(quads: Quad[]): Promise<Quad[]> {
        const atomizeCompact = atomizeCompactPolicies(quads);
        const atomized = atomizeCompositeRules(quads);
        
        return Promise.resolve(atomized);
    }

    
}