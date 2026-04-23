import { Parser, Writer } from "n3";
import { atomizeCompactPolicies } from "./src/AtomizeCompactPolicies"
import { atomizeCompositeRules } from "./src/AtomizeCompositeRules";

const parser = new Parser();
const writer = new Writer();

async function main() {
    const compactPolicy = `
    @prefix : <http://example.org/#> .
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .

:policy2 a odrl:Policy ;
    odrl:assignee :alice, :bob ;
    odrl:permission :rule1, :rule2 .

:rule1 a odrl:Permission ;
    odrl:action odrl:read ;
    odrl:target :resourceX .

:rule2 a odrl:Permission ;
    odrl:duty :rule3 ;
    odrl:action odrl:modify ;
    odrl:target :resourceY .

:rule3 a odrl:Duty ;
    odrl:action odrl:delete. 
    `
    console.log("Atomize compact policy")
    const atomizedCompactPolicy = atomizeCompactPolicies(parser.parse(compactPolicy))
    console.log(writer.quadsToString(atomizeCompactPolicies(parser.parse(compactPolicy))))
    console.log()
    console.log("Atomize composite rules of compact policy (should be identical as OG)")
    console.log(writer.quadsToString(atomizeCompositeRules(parser.parse(compactPolicy))))
    console.log()
    console.log("Atomize composite rules of result of compact policy")
    console.log(writer.quadsToString(atomizeCompositeRules(atomizedCompactPolicy)))

}
main()