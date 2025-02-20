import { test, assert, describe } from "vitest";
import { Lexer } from "./lexer";
import { TokenType, TOKEN_TYPE } from "./token";

describe("next token", () => {
  const source = `graph {
    a -> b
    a -- b;
    c [cost=10.23]
    c -- d [cost=10]
}

test {}

subgraph
`;

  const lexer = new Lexer(source);

  const tests: Array<[TokenType, string]> = [
    // graph {
    [TOKEN_TYPE.Graph, "graph"],
    [TOKEN_TYPE.LBrace, "{"],

    // a -> b
    [TOKEN_TYPE.Id, "a"],
    [TOKEN_TYPE.DirectedEdge, "->"],
    [TOKEN_TYPE.Id, "b"],

    // a -- b
    [TOKEN_TYPE.Id, "a"],
    [TOKEN_TYPE.Edge, "--"],
    [TOKEN_TYPE.Id, "b"],
    ["SEMICOLON", ";"],

    // c [cost=10.23]
    [TOKEN_TYPE.Id, "c"],
    [TOKEN_TYPE.LBracket, "["],
    [TOKEN_TYPE.Id, "cost"],
    [TOKEN_TYPE.Eq, "="],
    [TOKEN_TYPE.Number, "10.23"],
    [TOKEN_TYPE.RBracket, "]"],

    // c -- d [cost=10]
    [TOKEN_TYPE.Id, "c"],
    [TOKEN_TYPE.Edge, "--"],
    [TOKEN_TYPE.Id, "d"],
    [TOKEN_TYPE.LBracket, "["],
    [TOKEN_TYPE.Id, "cost"],
    [TOKEN_TYPE.Eq, "="],
    [TOKEN_TYPE.Number, "10"],
    [TOKEN_TYPE.RBracket, "]"],

    // }
    [TOKEN_TYPE.RBrace, "}"],

    [TOKEN_TYPE.Id, "test"],
    [TOKEN_TYPE.LBrace, "{"],
    [TOKEN_TYPE.RBrace, "}"],
    [TOKEN_TYPE.Subgraph, "subgraph"],
    [TOKEN_TYPE.EOF, "<eof>"],
  ];

  for (const [expectedTokenType, expectedLiteral] of tests) {
    test("", () => {
      const token = lexer.nextToken();
      assert.strictEqual(token.type, expectedTokenType);
      assert.strictEqual(token.literal, expectedLiteral);
    });
  }
});
