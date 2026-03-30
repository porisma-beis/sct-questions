#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const questionsDir = path.join(repoRoot, "questions");
const distDir = path.join(repoRoot, "dist");
const outputPath = path.join(distDir, "questions.json");
const schemaPath = path.join(repoRoot, "schema.json");
const isCheckMode = process.argv.includes("--check");

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value.startsWith("\"") || value.startsWith("[") || value === "true" || value === "false" || value === "null") {
    return JSON.parse(value);
  }
  return value;
}

function parseEdgeFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const edge = { questions: [] };
  let currentQuestion = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (line.startsWith("id: ")) {
      edge.id = parseScalar(line.slice(4));
      continue;
    }

    if (line.startsWith("origin: ")) {
      edge.origin = parseScalar(line.slice(8));
      continue;
    }

    if (line.startsWith("destination: ")) {
      edge.destination = parseScalar(line.slice(13));
      continue;
    }

    if (trimmed === "questions:") {
      continue;
    }

    const questionStart = line.match(/^\s*-\s+id:\s+(.+)$/);
    if (questionStart) {
      currentQuestion = { id: parseScalar(questionStart[1]) };
      edge.questions.push(currentQuestion);
      continue;
    }

    const textMatch = line.match(/^\s+text:\s+(.+)$/);
    if (textMatch) {
      if (!currentQuestion) {
        throw new Error(`Encountered question text before question id in ${filePath}`);
      }
      currentQuestion.text = parseScalar(textMatch[1]);
      continue;
    }

    const tagsMatch = line.match(/^\s+tags:\s+(.+)$/);
    if (tagsMatch) {
      if (!currentQuestion) {
        throw new Error(`Encountered tags before question id in ${filePath}`);
      }
      currentQuestion.tags = parseScalar(tagsMatch[1]);
      continue;
    }

    throw new Error(`Unsupported YAML line in ${filePath}: ${line}`);
  }

  return edge;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateAgainstSchema(edge, filePath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const questionSchema = schema.properties.questions.items;
  const allowedEdgeKeys = new Set(Object.keys(schema.properties));
  const allowedQuestionKeys = new Set(Object.keys(questionSchema.properties));

  assert(typeof edge === "object" && edge !== null, `${filePath}: edge must be an object`);
  assert(Object.keys(edge).every((key) => allowedEdgeKeys.has(key)), `${filePath}: edge contains unsupported properties`);
  assert(typeof edge.id === "string" && /^[a-z0-9-]+$/.test(edge.id), `${filePath}: invalid edge id`);
  assert(typeof edge.origin === "string" && edge.origin.length > 0, `${filePath}: missing origin`);
  assert(typeof edge.destination === "string" && edge.destination.length > 0, `${filePath}: missing destination`);
  assert(Array.isArray(edge.questions), `${filePath}: questions must be an array`);

  const questionIds = new Set();
  for (const question of edge.questions) {
    assert(typeof question === "object" && question !== null, `${filePath}: question must be an object`);
    assert(Object.keys(question).every((key) => allowedQuestionKeys.has(key)), `${filePath}: question contains unsupported properties`);
    assert(typeof question.id === "string" && /^[a-z0-9-]+$/.test(question.id), `${filePath}: invalid question id`);
    assert(!questionIds.has(question.id), `${filePath}: duplicate question id ${question.id}`);
    questionIds.add(question.id);
    assert(typeof question.text === "string" && question.text.trim().length > 0, `${filePath}: question text is required`);
    assert(Array.isArray(question.tags), `${filePath}: tags must be an array`);
    assert(question.tags.length >= 1 && question.tags.length <= 3, `${filePath}: tags must contain 1-3 entries`);
    assert(new Set(question.tags).size === question.tags.length, `${filePath}: duplicate tags are not allowed`);
    for (const tag of question.tags) {
      assert(typeof tag === "string" && /^[a-z0-9-]+$/.test(tag), `${filePath}: invalid tag ${tag}`);
    }
  }
}

function buildCompiledData(edges) {
  const nodes = Array.from(
    new Set(
      edges.flatMap((edge) => [edge.origin, edge.destination])
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ id: label, label }));

  const compiledEdges = edges
    .map((edge) => ({
      id: edge.id,
      origin: edge.origin,
      destination: edge.destination
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const questions = edges
    .flatMap((edge) =>
      edge.questions.map((question) => ({
        id: question.id,
        origin: edge.origin,
        destination: edge.destination,
        text: question.text,
        tags: [...question.tags]
      }))
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges: compiledEdges, questions };
}

function main() {
  const files = fs
    .readdirSync(questionsDir)
    .filter((fileName) => fileName.endsWith(".yaml"))
    .sort((a, b) => a.localeCompare(b));

  assert(files.length > 0, "No question YAML files found. Run npm run import:working-document first.");

  const edges = files.map((fileName) => {
    const filePath = path.join(questionsDir, fileName);
    const edge = parseEdgeFile(filePath);
    validateAgainstSchema(edge, filePath);
    return edge;
  });

  const compiled = buildCompiledData(edges);
  const compiledJson = `${JSON.stringify(compiled, null, 2)}\n`;

  if (isCheckMode) {
    assert(fs.existsSync(outputPath), "dist/questions.json is missing. Run npm run build.");
    const currentJson = fs.readFileSync(outputPath, "utf8");
    assert(currentJson === compiledJson, "dist/questions.json is out of date. Run npm run build.");
    console.log(`Validated ${files.length} YAML files and confirmed dist/questions.json is current.`);
    return;
  }

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(outputPath, compiledJson);
  console.log(`Built ${path.relative(repoRoot, outputPath)} from ${files.length} YAML files.`);
}

main();
