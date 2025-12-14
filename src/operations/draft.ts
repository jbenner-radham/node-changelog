import {
  buildChangeTypeSection,
  buildUnlinkedUnreleasedHeading,
  buildUnreleasedDefinition,
  buildUnreleasedHeading
} from '~/builders.js';
import { CHANGE_TYPES, UNRELEASED_IDENTIFIER } from '~/constants.js';
import { isDefinition, isHeading } from '~/identity.js';
import type { ChangeType } from '~/types.js';
import { isVersionString } from '~/utilities.js';
import hostedGitInfo from 'hosted-git-info';
import type { Node, Nodes, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import flatMap from 'unist-util-flatmap';
import { select, selectAll } from 'unist-util-select';

export function withUnreleasedSection(tree: Root, { changeTypes = CHANGE_TYPES, pkg }: {
  changeTypes?: ChangeType[];
  pkg: PackageJson;
}): Root {
  const repository: string = hostedGitInfo.fromManifest(pkg).browse();
  const hasPreexistingUnreleasedHeading = hasUnreleasedHeading(tree);
  const releaseHeadingFound = hasReleaseHeading(tree);

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
        buildUnreleasedHeading(),
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
    newTree.children.push(
      releaseHeadingFound
        ? buildUnreleasedHeading()
        : buildUnlinkedUnreleasedHeading(),
      ...changeTypes.flatMap(buildChangeTypeSection)
    );
  }

  if (hasUnreleasedHeadingLink(tree) && !hasUnreleasedDefinition(newTree) && releaseHeadingFound) {
    newTree.children.push(buildUnreleasedDefinition({ from: pkg.version!, repository }));
  }

  return newTree;
}

export function hasReleaseHeading(tree: Nodes): boolean {
  return selectAll('heading[depth="2"] > linkReference', tree)
    .some(node => isVersionString(toString(node)));
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
