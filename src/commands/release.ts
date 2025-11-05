import {
  buildChangeTypeSection,
  buildLinkedVersionHeadingWithDate,
  buildVersionDefinition
} from '../builders.js';
import { UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading, isText } from '../identity.js';
import { hasDefinition, hasDepthTwoHeading } from '../tree-contains.js';
import type { ChangeType } from '../types.js';
import { getDate, isVersionString } from '../util.js';
import { hasUnreleasedHeading } from './unreleased.js';
import hostedGitInfo from 'hosted-git-info';
import type { Definition, Root, Text } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withRelease(tree: Root, { changeTypes, pkg, version }: {
  changeTypes: ChangeType[];
  pkg: PackageJson;
  version: string;
}): Root {
  const repository = hostedGitInfo.fromManifest(pkg).browse();
  const clonedTree = structuredClone(tree);

  if (!hasDefinition(clonedTree) && !hasDepthTwoHeading(clonedTree)) {
    clonedTree.children.push(...[
      buildLinkedVersionHeadingWithDate(version),
      ...changeTypes.flatMap(buildChangeTypeSection),
      buildVersionDefinition({ to: version, repository })
    ]);

    return clonedTree;
  }

  if (hasUnreleasedHeading(clonedTree)) {
    return withUnreleasedAsRelease(clonedTree, { pkg, version });
  }

  // const hasVersionHeadings = Boolean(
  //   selectAll('heading[depth="2"]', tree)
  //     .filter(node => {
  //       const [child] = (node as Heading).children ?? [];
  //
  //       return child?.type === 'linkReference' && /^\d+\.\d+\.\d+$/.test(child?.identifier);
  //     }).length
  // );
  // const hasVersionDefinitions = Boolean(
  //   selectAll('definition', tree)
  //     .filter(definition =>
  //       /^\d+\.\d+\.\d+$/.test((definition as Definition).identifier)
  //     ).length
  // );

  let foundReleaseHeading = false;
  let foundVersionDefinition = false;

  return flatMap(clonedTree, node => {
    if (isHeading(node) && node.depth === 2 && !foundReleaseHeading) {
      foundReleaseHeading = true;

      return [
        buildLinkedVersionHeadingWithDate(version),
        ...changeTypes.flatMap(buildChangeTypeSection),
        node
      ];
    }

    if (isDefinition(node) && isVersionString(node.identifier) && !foundVersionDefinition) {
      foundVersionDefinition = true;

      return [
        buildVersionDefinition({ from: pkg.version!, to: version, repository }),
        node
      ];
    }

    return [node];
  });
}

export function withUnreleasedAsRelease(tree: Root, { pkg, version }: {
  pkg: PackageJson;
  version: string;
}): Root {
  const repository = hostedGitInfo.fromManifest(pkg).browse();
  const newTree = flatMap(tree, node => {
    if (isHeading(node) && node.depth === 2) {
      const text = select<Text>(`text[value="${UNRELEASED_IDENTIFIER}"]`, node);

      if (isText(text)) {
        // TODO: Handle instances where the `text` node is not the only child.
        text.value = version;
        node.children = [
          u('linkReference', { identifier: version, referenceType: 'shortcut' as const }, [
            text
          ]),
          u('text', ` - ${getDate()}`)
        ];
      }
    } else if (
      isDefinition(node) &&
      normalizeIdentifier(node.identifier) === normalizeIdentifier(UNRELEASED_IDENTIFIER)
    ) {
      node.identifier = version;
      node.label = version;

      // TODO: This URL works with GitHub and redirects to the correct URL for GitLab.
      //       Look into this for BitBucket and possibly use the redirect syntax for GitLab.
      node.url = `${repository}/compare/v${pkg.version}...v${version}`;
    }

    return [node];
  });

  const definition = select<Definition>(`definition[identifier="${version}"]`, newTree);

  if (!definition) {
    newTree.children.push(buildVersionDefinition({ to: version, repository }));
  }

  return newTree;
}
