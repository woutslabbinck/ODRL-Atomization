import { Quad } from "@rdfjs/types";
import { atomizeCompactPolicies } from "./AtomizeCompactPolicies";
import { atomizeCompositeRules } from "./AtomizeCompositeRules";


export interface IAtomizer {
    atomize(quads: Quad[]): Promise<Quad[]>
}

export class Atomizer implements IAtomizer {
    public constructor(){

    }
    atomize(quads: Quad[]): Promise<Quad[]> {
        const atomizeCompact = atomizeCompactPolicies(quads);
        const atomized = atomizeCompositeRules(atomizeCompact);
        
        return Promise.resolve(atomized);
    }

    
}