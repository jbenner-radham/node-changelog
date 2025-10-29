import { UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading, isText } from '../identity.js';
import { getNormalizedRepository } from '../util.js';
import { hasUnreleasedHeader } from './unreleased.js';
import type { Node, Root } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withRelease(tree: Root, { pkg, version }: {
  pkg: PackageJson;
  version: string;
}): Root {
  if (hasUnreleasedHeader(tree)) {
    return withUnreleasedAsRelease(tree, { pkg, version });
  }

  // console.debug('Else...');
}

export function withUnreleasedAsRelease(tree: Root, { pkg, version }: {
  pkg: PackageJson;
  version: string;
}): Root {
  if (!pkg.repository) {
    // Do something here...
  }

  if (!pkg.version) {
    // Also, do something here...
  }

  const repository = getNormalizedRepository(pkg.repository!);
  const newTree = flatMap(tree, (node: Node) => {
    if (node.position) {
      delete node.position;
    }

    if (isHeading(node) && node.depth === 2) {
      // console.dir(node, { depth: undefined });
      // console.debug(matches('heading[depth="2"]', node));
      const text = select(`text[value="${UNRELEASED_IDENTIFIER}"]`, node);

      if (isText(text)) {
        text.value = version;
      }
    } else if (
      isDefinition(node) &&
      normalizeIdentifier(node.identifier) === normalizeIdentifier(UNRELEASED_IDENTIFIER)
    ) {
      node.identifier = version;
      node.label = version;
      node.url = `${repository}/compare/v${pkg.version}...v${version}`;
      console.dir(node, { depth: undefined });
    }

    return [node];
  });

  const definition = select(`definition[identifier="${version}"]`, newTree);

  if (!definition) {
    newTree.children.push(
      u('definition', {
        identifier: version,
        label: version,
        url: `${repository}/releases/tag/v${version}`
      })
    );
  }

  return newTree;
}
