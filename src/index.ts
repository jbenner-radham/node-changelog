import { withUnreleasedSection } from './unreleased.js';
import { getPackage } from './util.js';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfm } from 'micromark-extension-gfm';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.argv.length > 2 ? path.dirname(process.argv[2]!) : process.cwd();
const changelogPath = process.argv.length > 2 ? process.argv[2]! : 'CHANGELOG.md';
const source = await fs.readFile(changelogPath, 'utf8');
const tree = fromMarkdown(source, {
  extensions: [gfm()],
  mdastExtensions: [gfmFromMarkdown()]
});

// console.debug(tree);

// visit(tree, node => {
//   console.dir(node, { depth: undefined });
// });

// console.debug(tree.children.at(-1).position);

// tree.children.push({
//   type: 'definition',
//   identifier: '0.2.0',
//   label: '0.2.0',
//   url: 'https://www.example.com/0.2.0'
// });

// console.debug(tree);

// const versionIdentifiers = filter(tree, { cascade: false }, node => {
//   console.debug('NODE!', node, node.type === 'definition');
//   return node.type === 'heading';
//   // return true;
// });

// const getPkg = async () => {
//   const source = await fs.readFile('package.json', 'utf8');
//
//   return JSON.parse(source);
// };
//
// const stripGitPrefixAndSuffix = (value: string): string =>
//   value.replace(/^git\+/, '').replace(/\.git$/, '');
//
// const versionIdentifiers = tree?.children?.filter(node =>
//   node.type === 'definition' && /^\d+\.\d+\.\d+$/.test(node.identifier)
// );

// console.debug(versionIdentifiers);

// if (!versionIdentifiers?.length) {
//   const pkg = await getPkg();
//   const repository = stripGitPrefixAndSuffix(pkg.repository.url);
//   const initialVersion = '0.1.0';
//   const initialVersionDefinition: Definition = {
//     type: 'definition',
//     identifier: initialVersion,
//     label: initialVersion,
//     url: `${repository}/releases/tag/${initialVersion}`
//   };
//   tree.children.push(initialVersionDefinition);
// }

// const pkg = await getPkg();
// const repository = stripGitPrefixAndSuffix(pkg.repository.url);
// const unreleasedDefinition: Definition = {
//   type: 'definition',
//   identifier: 'Unreleased',
//   label: 'Unreleased',
//   url: `${repository}/compare/v${pkg.version}...HEAD`
// };
// tree.children.push(unreleasedDefinition);

// console.debug(repository);

// let h2Found = false;
// let versionDefinitionFound = false;
//
// const newTree = flatMap(tree, (node: Node) => {
//   if (node.position) {
//     delete node.position;
//   }
//
//   if (node.type === 'heading' && (node as Heading).depth === 2 && !h2Found) {
//     h2Found = true;
//     const unreleasedSection = [
//       {
//         type: 'heading',
//         depth: 2,
//         children: [
//           {
//             type: 'linkReference',
//             children: [
//               {
//                 type: 'text',
//                 value: 'Unreleased'
//               }
//             ],
//             label: 'Unreleased',
//             identifier: 'Unreleased',
//             referenceType: 'shortcut'
//           }
//         ]
//       },
//       {
//         type: 'paragraph',
//         children: [
//           {
//             type: 'text',
//             value: '...'
//           }
//         ]
//       }
//     ];
//
//     return [...unreleasedSection, node];
//   }
//
//   if (
//     node.type === 'definition' &&
//     /^\d+\.\d+\.\d+$/.test((node as Definition).identifier) &&
//     !versionDefinitionFound
//   ) {
//     versionDefinitionFound = true;
//     const unreleasedDefinition: Definition = {
//       type: 'definition',
//       identifier: 'Unreleased',
//       label: 'Unreleased',
//       url: `${repository}/compare/v${pkg.version}...HEAD`
//     };
//
//     return [unreleasedDefinition, node];
//   }
//
//   return [node];
// });

const pkg = getPackage(cwd);
const newTree = withUnreleasedSection(tree, { pkg });

// console.dir(newTree, { depth: undefined });

const markdown = toMarkdown(newTree, {
  bullet: '-',
  extensions: [gfmToMarkdown()],
  setext: true,
  tightDefinitions: true
});

// const formatted = await prettier.format(markdown, { parser: 'markdown' });

console.debug(markdown);

// console.debug(select('text[value="Unreleased"]', newTree));
// console.debug(select('heading[depth="2"] text[value="Unreleased"]', newTree));
// console.debug(normalizeIdentifier('Unreleased'));

// console.debug(process.argv)
