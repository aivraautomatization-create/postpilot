import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: [
    'react-markdown',
    'remark-parse',
    'remark-rehype',
    'unified',
    'vfile',
    'vfile-message',
    'unist-util-visit',
    'unist-util-visit-parents',
    'unist-util-is',
    'mdast-util-from-markdown',
    'mdast-util-to-hast',
    'mdast-util-to-string',
    'hast-util-to-jsx-runtime',
    'hast-util-whitespace',
    'property-information',
    'space-separated-tokens',
    'comma-separated-tokens',
    'micromark',
    'decode-named-character-reference',
    'character-entities',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@google/genai', 'gcp-metadata'],
};

export default nextConfig;
