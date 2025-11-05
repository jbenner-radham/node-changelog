import { UNRELEASED_IDENTIFIER } from './constants.js';
import { getDate, getRepositoryTaggedReleaseUrl, getRepositoryVersionCompareUrl } from './util.js';
import type { Definition, Heading, List } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import { u } from 'unist-builder';

export function buildChangeTypeSection(changeType: string): [Heading, List] {
  return [
    u('heading', { depth: 3 as const }, [
      u('text', changeType)
    ]),
    u('list', { ordered: false, start: null, spread: false }, [
      u('listItem', { checked: null, spread: false }, [
        u('paragraph', [
          u('text', '...')
        ])
      ])
    ])
  ];
}

export function buildLinkedVersionHeadingWithDate(version: string): Heading {
  return u('heading', { depth: 2 as const }, [
    u('linkReference', { identifier: version, referenceType: 'shortcut' as const }, [
      u('text', version)
    ]),
    u('text', ` - ${getDate()}`)
  ]);
}

export function buildUnreleasedDefinition({ from, repository }: {
  from: string;
  repository: string;
}): Definition {
  return u('definition', {
    identifier: normalizeIdentifier(UNRELEASED_IDENTIFIER),
    url: getRepositoryVersionCompareUrl(repository, from, 'HEAD')
  });
}

export function buildUnreleasedHeading(): Heading {
  const identifier = UNRELEASED_IDENTIFIER;

  return u('heading', { depth: 2 as const }, [
    u('linkReference', { identifier, referenceType: 'shortcut' as const }, [
      u('text', identifier)
    ])
  ]);
}

export function buildVersionDefinition({ from, to, repository }: {
  from?: string;
  to: string;
  repository: string;
}): Definition {
  // TODO: Look into URL syntax for GitLab and BitBucket.
  return u('definition', {
    identifier: to,
    url: from && from !== to
      ? getRepositoryVersionCompareUrl(repository, from, to)
      : getRepositoryTaggedReleaseUrl(repository, to)
  });
}
