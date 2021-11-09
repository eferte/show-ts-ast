const { readFileSync, writeFileSync } = require("fs");
const ts = require("typescript");
const tsSyntaxKind = require('./tsSyntaxKind');

function extract(sourceFile) {
  const result = [];
  const output = (...args) => {
    const [line, character, len, ...rest] = args;
    result.push(
      "L " + (line + 1) + ", col " + (character + 1) + ", len " + len + "  " + rest.join("").replace(/\n/g, " ")
    );
  };

  analyseNode(sourceFile, 0);

  function analyseNode(node, deep) {
    const start = () => Array(deep).join(". ");

    let { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    let len = node.getEnd() - node.getStart();

    const kind = tsSyntaxKind[node.kind];
    output(line, character, len, start() + kind, "        >> ", node.getText().substring(0, 100));

    if (node.kind !== ts.SyntaxKind.EndOfFileToken) {
      ts.forEachChild(node, (node) => analyseNode(node, deep + 1));
    }
  }

  return result;
}

const extractTestParameters = (fileName) => {
  const sourceFile = ts.createSourceFile(
    fileName,
    readFileSync(fileName).toString("utf-8"),
    ts.ScriptTarget.ES2021,
    /*setParentNodes */ true
  );

  const result = extract(sourceFile);
  writeFileSync(fileName + ".txt", result.join("\n"), "utf-8");
};

extractTestParameters(process.argv[process.argv.length - 1]);
