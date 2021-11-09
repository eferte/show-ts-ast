const { readFileSync, writeFileSync } = require("fs");
const ts = require("typescript");
const tsSyntaxKind = require("./tsSyntaxKind");

function extract(sourceFile) {
  const result = {};
  const output = (...args) => {
    const [line, character, len, ...rest] = args;
    result.push(
      "L " + (line + 1) + ", col " + (character + 1) + ", len " + len + "  " + rest.join("").replace(/\n/g, " ")
    );
  };

  analyseNode(sourceFile, 0, result);

  function analyseNode(node, deep, result) {
    let { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    let len = node.getEnd() - node.getStart();

    const kind = tsSyntaxKind[node.kind];
    result.kind = kind;
    result.line = line;
    result.col = character;
    result.len = len;
    result.textPreview = node.getText().substring(0, 100);

    if (node.kind !== ts.SyntaxKind.EndOfFileToken) {
      const children = [];
      ts.forEachChild(node, (node) => {
        const child = {};
        analyseNode(node, deep + 1, child);
        children.push(child);
      });
      if (children.length > 0) {
        result.children = children;
      }
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
  writeFileSync(fileName + ".json", JSON.stringify(result, null, 3), "utf-8");
};

extractTestParameters(process.argv[process.argv.length - 1]);
