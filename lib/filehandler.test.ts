import { assertEquals } from "@std/assert";
import { test } from "@cross/test";
import { parseEnvFile } from "./filehandler.ts";

const parse = (content: string) => parseEnvFile(content, {});

/** ==== parseEnvFile() ==== */
test("parseEnvFile() parses keys, values, comments and quotes", () => {
    const vars = parse("# comment\n\nA=1\nB = two \nC=\"quoted value\"\nD='single'\nE=x=y\r\n");
    assertEquals({ ...vars }, { A: "1", B: "two", C: "quoted value", D: "single", E: "x=y" });
});

test("parseEnvFile() expands references to earlier variables", () => {
    const vars = parse("HOST=localhost\nPORT=5432\nURL=postgres://$HOST:$PORT/db\nNESTED=$URL");
    assertEquals(vars.URL, "postgres://localhost:5432/db");
    assertEquals(vars.NESTED, "postgres://localhost:5432/db");
});

test("parseEnvFile() does not match a variable name that is a prefix of the reference", () => {
    const vars = parse("FOO=short\nFOOBAR=long\nX=$FOOBAR\nY=$FOO_BAR");
    assertEquals(vars.X, "long");
    assertEquals(vars.Y, "$FOO_BAR");
});

test("parseEnvFile() leaves references to unknown variables untouched", () => {
    const vars = parse("A=$MISSING\nB=cost: $5");
    assertEquals(vars.A, "$MISSING");
    assertEquals(vars.B, "cost: $5");
});

test("parseEnvFile() keeps $ sequences in expanded values literal", () => {
    const vars = parse("PW=pa$$word\nUSEPW=$PW\nAMP=a$&b$1\nUSEAMP=$AMP");
    assertEquals(vars.USEPW, "pa$$word");
    assertEquals(vars.USEAMP, "a$&b$1");
});

test("parseEnvFile() treats \\$NAME as a literal $NAME", () => {
    const vars = parse("B=1\nESC=\\$B\nMIXED=$B\\$B");
    assertEquals(vars.ESC, "$B");
    assertEquals(vars.MIXED, "1$B");
});

test("parseEnvFile() does not expand escaped references stored in earlier values", () => {
    const vars = parse("B=1\nLITERAL=\\$B\nUSE=$LITERAL");
    assertEquals(vars.USE, "$B");
});

test("parseEnvFile() skips expansion and escapes when enableExpansion is false", () => {
    const vars = parseEnvFile("A=1\nB=$A\nC=\\$A", { dotEnv: { enableExpansion: false } });
    assertEquals(vars.B, "$A");
    assertEquals(vars.C, "\\$A");
});

test("parseEnvFile() keeps quotes when allowQuotes is false", () => {
    const vars = parseEnvFile('A="x"', { dotEnv: { allowQuotes: false } });
    assertEquals(vars.A, '"x"');
});

test("parseEnvFile() does not expand prototype properties", () => {
    const vars = parse("A=$toString\nB=$__proto__");
    assertEquals(vars.A, "$toString");
    assertEquals(vars.B, "$__proto__");
});
