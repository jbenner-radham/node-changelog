import type { Root } from 'mdast';
import { u } from 'unist-builder';

export function getBase(): Root {
  return (
    u('root', [
      u('heading', { depth: 1 as const }, [
        u('text', 'Changelog')
      ]),
      u('paragraph', [
        u('text', 'All notable changes to this project will be documented in this file.')
      ]),
      u('paragraph', [
        u('text', 'The format is based on '),
        u('link', { url: 'https://keepachangelog.com/en/1.1.0/' }, [
          u('text', 'Keep a Changelog')
        ]),
        u('text', ',\nand this project adheres to '),
        u('link', { url: 'https://semver.org/spec/v2.0.0.html' }, [
          u('text', 'Semantic Versioning')
        ]),
        u('text', '.')
      ])
    ])
  );
}

export function getBaseWithUnreleasedSection(): Root {
  const tree = getBase();

  tree.children.push(
    u('heading', { depth: 2 as const }, [
      u('text', 'Unreleased')
    ]),
    u('heading', { depth: 3 as const }, [
      u('text', 'Added')
    ]),
    u('list', { ordered: false, spread: false, start: null }, [
      u('listItem', { checked: null, spread: false }, [
        u('paragraph', [
          u('text', 'Initial release.')
        ])
      ])
    ])
  );

  return tree;
}
