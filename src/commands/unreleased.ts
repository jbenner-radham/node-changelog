import {
  buildChangeTypeSection,
  buildLinkedVersionHeadingWithDate,
  buildUnreleasedDefinition,
  buildUnreleasedHeading
} from '../builders.js';
import { CHANGE_TYPES, UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading } from '../identity.js';
import type { ChangeType } from '../types.js';
import { isVersionString } from '../util.js';
import hostedGitInfo from 'hosted-git-info';
import type { Node, Nodes, Root } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withUnreleasedSection(tree: Root, { changeTypes = CHANGE_TYPES, pkg }: {
  changeTypes?: ChangeType[];
  pkg: PackageJson;
}): Root {
  const identifier = UNRELEASED_IDENTIFIER;
  const repository = hostedGitInfo.fromManifest(pkg).browse();
  const hasPreexistingUnreleasedHeading = hasUnreleasedHeading(tree);

  let depthTwoHeadingFound = false;
  let versionDefinitionFound = false;

  const newTree = flatMap(tree, (node: Node) => {
    // TODO: Disabling linking pre-existing "Unreleased" headers for now. Look into this later!
    // if (isHeading(node) && node.depth === 2 && hasPreexistingUnreleasedHeading) {
    //   const [child] = node.children;
    //
    //   if (child?.type === 'text' && child?.value === identifier) {
    //     node.children = [
    //       u('linkReference', { identifier, label, referenceType: 'shortcut' as const }, [
    //         u('text', identifier)
    //       ])
    //     ];
    //   }
    // }

    if (
      isHeading(node) &&
      node.depth === 2 &&
      !depthTwoHeadingFound &&
      !hasPreexistingUnreleasedHeading
    ) {
      depthTwoHeadingFound = true;

      const unreleasedSection = [
        buildLinkedVersionHeadingWithDate(identifier),
        ...changeTypes.flatMap(buildChangeTypeSection)
      ];

      return [...unreleasedSection, node];
    }

    if (isDefinition(node) && isVersionString(node.identifier) && !versionDefinitionFound) {
      versionDefinitionFound = true;

      const unreleasedDefinition = buildUnreleasedDefinition({
        from: pkg.version!,
        repository
      });

      return [unreleasedDefinition, node];
    }

    return [node];
  });

  if (!hasUnreleasedHeading(newTree)) {
    newTree.children.push(...[
      buildUnreleasedHeading(),
      ...changeTypes.flatMap(buildChangeTypeSection)
    ]);
  }

  if (hasUnreleasedHeadingLink(tree) && !hasUnreleasedDefinition(newTree)) {
    newTree.children.push(buildUnreleasedDefinition({ from: pkg.version!, repository }));
  }

  return newTree;
}

export function hasUnreleasedDefinition(tree: Nodes): boolean {
  const identifier = normalizeIdentifier(UNRELEASED_IDENTIFIER);

  return Boolean(
    select(`definition[identifier="${identifier}"]`, tree)
  );
}

export function hasUnreleasedHeading(tree: Nodes): boolean {
  return Boolean(
    select(`heading[depth="2"] text[value="${UNRELEASED_IDENTIFIER}"]`, tree)
  );
}

export function hasUnreleasedHeadingLink(tree: Nodes): boolean {
  const identifier = UNRELEASED_IDENTIFIER;

  return Boolean(
    select(
      `heading[depth="2"] linkReference[identifier="${identifier}"] text[value="${identifier}"]`,
      tree
    )
  );
}
