# ODRL Atomization
[![npm](https://img.shields.io/npm/v/odrl-atomization)](https://www.npmjs.com/package/odrl-atomization)

[Open Digital Rights Language (ODRL)](https://www.w3.org/TR/odrl-model/) policies express **who** can do **which action** on **which resource**, under **which conditions**, using deontic rules such as **Permissions**, **Prohibitions**, and **Obligations**.   
This library **normalizes ("atomizes") ODRL policies and rules** into a shape that is easier to process by evaluators and enforcement engines (e.g., for access control / usage control). 

## Terminology

This library uses the following terminology:

### Atomic rules

An **atomic rule** in ODRL means that each rule has maximum **one value** for the following core properties: `odrl:assignee`, `odrl:assigner`, `odrl:action`, and `odrl:target`.
A policy is *atomic* when each rule is atomic.

### Composite rules

A rule is *composite* when it contains **multiple values** for one or more of these core properties (e.g., two assignees or two actions). 
Atomization **splits** such a rule into multiple derived rules.

NOTE: in this library we use `<http://example.org/ns/derivedFrom>` to link each derived rule back to the original rule.

### Compact policies

A policy is *compact* when the above core properties are placed at **policy level** (e.g., `odrl:assignee` on the policy instead of on each rule).
Atomization **propagates** these policy-level properties down to the rules while preserving ODRL's rule structure. 
This includes propagating to nested rules: duties that can be attached to permissions, prohibitions, or duties.

## How to run the library

NOTE: this is tested for node v20 (if you use nvm, run `nvm use 20`)

### Install

```bash
npm install odrl-atomization
```

### Minimal example (TypeScript / Node)

This example shows a **compact** policy (assigner on policy) with a **composite** rule (two assignees on the permission).

```ts
import { DataFactory, Store, Writer } from 'n3'
import { Atomizer, ODRL, RDF } from 'odrl-atomization'

const { namedNode, quad } = DataFactory
const EX = 'http://example.org/'
const EXNS = 'http://example.org/ns/'

const policy = namedNode(EX + 'policy1')
const rule1 = namedNode(EX + 'rule1')
const alice = namedNode(EX + 'alice')
const bob = namedNode(EX + 'bob')
const charlie = namedNode(EX + 'charlie')
const resourceX = namedNode(EX + 'resourceX')

const derivedFrom = namedNode(EXNS + 'derivedFrom')

// A compact + composite policy (as quads)
const input = [
  quad(policy, RDF.terms.type, ODRL.terms.Policy),
  quad(policy, ODRL.terms.permission, rule1),

  // compact: policy-level assigner
  quad(policy, ODRL.terms.assigner, alice),

  // rule1 is composite: two assignees
  quad(rule1, RDF.terms.type, ODRL.terms.Permission),
  quad(rule1, ODRL.terms.action, ODRL.terms.read),
  quad(rule1, ODRL.terms.target, resourceX),
  quad(rule1, ODRL.terms.assignee, bob),
  quad(rule1, ODRL.terms.assignee, charlie),
]

// Atomize 
const atomized = await new Atomizer().atomize(input)
const store = new Store(atomized)

console.log('--- Atomized quads ---')
console.log(new Writer().quadsToString(store.getQuads(null, null, null, null)))
```

### How does it work?

The original policy is **compact** (assigner at policy level) and contains a **composite rule** (multiple assignees on a single permission):

```turtle
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .

<http://example.org/policy1>
  a odrl:Policy ;
  odrl:permission <http://example.org/rule1> ;
  odrl:assigner <http://example.org/alice> .

<http://example.org/rule1>
  a odrl:Permission ;
  odrl:action odrl:read ;
  odrl:target <http://example.org/resourceX> ;
  odrl:assignee <http://example.org/bob>, <http://example.org/charlie> .
```

After atomization:
*   Policy-level properties are **propagated** to the rules (alice is now the assigner in both rules)
*   Composite rules are **split into atomic rules**
*   New rule identifiers are generated (UUID IRIs)
*   Each derived rule links back to the original rule using  
    `<http://example.org/ns/derivedFrom>`

```turtle
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .

<http://example.org/policy1> a odrl:Policy ;
  odrl:permission <urn:uuid:0d2412f3-a330-4bfb-a23a-dc1d1110f47c> , <urn:uuid6e7b8427-c043-4999-9ebb-97064ad4df08> .

<urn:uuid:0d2412f3-a330-4bfb-a23a-dc1d1110f47c> a odrl:Permission ;
  odrl:assigner <http://example.org/alice> ;
  odrl:assignee <http://example.org/bob> ;
  odrl:action odrl:read ;
  odrl:target <http://example.org/resourceX> ;
  <http://example.org/ns/derivedFrom> <http://example.org/rule1> .

<urn:uuid6e7b8427-c043-4999-9ebb-97064ad4df08> a odrl:Permission ;
  odrl:assigner <http://example.org/alice> ;
  odrl:assignee <http://example.org/charlie> ;
  odrl:action odrl:read ;
  odrl:target <http://example.org/resourceX> ;
  <http://example.org/ns/derivedFrom> <http://example.org/rule1> .
```

## Feedback and questions

Do not hesitate to [report a bug](https://github.com/woutslabbinck/ODRL-Atomization/issues).

Further questions can also be asked to [Wout Slabbinck](mailto:wout.slabbinck@ugent.be) (developer and maintainer of this repository).