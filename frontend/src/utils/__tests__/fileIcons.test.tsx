import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getLanguageFromExtension, getFileIcon, getFileCategory } from '../fileIcons';

describe('fileIcons utilities', () => {
  describe('getLanguageFromExtension', () => {
    it('returns correct language for JavaScript files', () => {
      expect(getLanguageFromExtension('app.js')).toBe('javascript');
      expect(getLanguageFromExtension('component.jsx')).toBe('javascript');
      expect(getLanguageFromExtension('module.mjs')).toBe('javascript');
      expect(getLanguageFromExtension('config.cjs')).toBe('javascript');
    });

    it('returns correct language for TypeScript files', () => {
      expect(getLanguageFromExtension('app.ts')).toBe('typescript');
      expect(getLanguageFromExtension('component.tsx')).toBe('typescript');
    });

    it('returns correct language for web files', () => {
      expect(getLanguageFromExtension('index.html')).toBe('html');
      expect(getLanguageFromExtension('styles.css')).toBe('css');
      expect(getLanguageFromExtension('styles.scss')).toBe('scss');
      expect(getLanguageFromExtension('styles.sass')).toBe('sass');
      expect(getLanguageFromExtension('styles.less')).toBe('less');
    });

    it('returns correct language for Python files', () => {
      expect(getLanguageFromExtension('script.py')).toBe('python');
      expect(getLanguageFromExtension('gui.pyw')).toBe('python');
    });

    it('returns correct language for config files', () => {
      expect(getLanguageFromExtension('package.json')).toBe('json');
      expect(getLanguageFromExtension('config.xml')).toBe('xml');
      expect(getLanguageFromExtension('docker-compose.yaml')).toBe('yaml');
      expect(getLanguageFromExtension('config.yml')).toBe('yaml');
    });

    it('returns correct language for markdown files', () => {
      expect(getLanguageFromExtension('README.md')).toBe('markdown');
      expect(getLanguageFromExtension('docs.markdown')).toBe('markdown');
    });

    it('returns plaintext for unknown extensions', () => {
      expect(getLanguageFromExtension('unknown.xyz')).toBe('plaintext');
      expect(getLanguageFromExtension('noextension')).toBe('plaintext');
    });

    it('handles special files without extensions', () => {
      expect(getLanguageFromExtension('.gitignore')).toBe('plaintext');
      expect(getLanguageFromExtension('.env')).toBe('plaintext');
      expect(getLanguageFromExtension('dockerfile')).toBe('dockerfile');
    });
  });

  describe('getFileIcon', () => {
    it('returns folder icon for folders', () => {
      const { container } = render(getFileIcon('src', true));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-500');
    });

    it('returns appropriate icons for JavaScript files', () => {
      const { container } = render(getFileIcon('app.js'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-yellow-500');
    });

    it('returns appropriate icons for TypeScript files', () => {
      const { container } = render(getFileIcon('app.ts'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('returns appropriate icons for Python files', () => {
      const { container } = render(getFileIcon('script.py'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-green-600');
    });

    it('returns appropriate icons for HTML files', () => {
      const { container } = render(getFileIcon('index.html'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-orange-500');
    });

    it('returns appropriate icons for CSS files', () => {
      const { container } = render(getFileIcon('styles.css'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-500');
    });

    it('returns appropriate icons for JSON files', () => {
      const { container } = render(getFileIcon('package.json'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-yellow-600');
    });

    it('returns appropriate icons for image files', () => {
      const { container } = render(getFileIcon('image.png'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-green-500');
    });

    it('returns appropriate icons for markdown files', () => {
      const { container } = render(getFileIcon('README.md'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('returns generic file icon for unknown types', () => {
      const { container } = render(getFileIcon('unknown.xyz'));
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-gray-500');
    });

    it('handles special files by name', () => {
      // Package.json should get package icon
      const { container: packageContainer } = render(getFileIcon('package.json'));
      const packageSvg = packageContainer.querySelector('svg');
      expect(packageSvg).toHaveClass('text-green-600');

      // Dockerfile should get package icon
      const { container: dockerContainer } = render(getFileIcon('dockerfile'));
      const dockerSvg = dockerContainer.querySelector('svg');
      expect(dockerSvg).toHaveClass('text-blue-600');

      // .gitignore should get settings icon
      const { container: gitContainer } = render(getFileIcon('.gitignore'));
      const gitSvg = gitContainer.querySelector('svg');
      expect(gitSvg).toHaveClass('text-orange-500');
    });
  });

  describe('getFileCategory', () => {
    it('categorizes code files correctly', () => {
      expect(getFileCategory('app.js')).toBe('code');
      expect(getFileCategory('app.ts')).toBe('code');
      expect(getFileCategory('script.py')).toBe('code');
      expect(getFileCategory('Main.java')).toBe('code');
      expect(getFileCategory('main.c')).toBe('code');
      expect(getFileCategory('main.cpp')).toBe('code');
      expect(getFileCategory('Program.cs')).toBe('code');
      expect(getFileCategory('main.go')).toBe('code');
      expect(getFileCategory('main.rs')).toBe('code');
      expect(getFileCategory('script.php')).toBe('code');
      expect(getFileCategory('script.rb')).toBe('code');
    });

    it('categorizes web files correctly', () => {
      expect(getFileCategory('index.html')).toBe('web');
      expect(getFileCategory('styles.css')).toBe('web');
      expect(getFileCategory('styles.scss')).toBe('web');
      expect(getFileCategory('styles.sass')).toBe('web');
    });

    it('categorizes data files correctly', () => {
      expect(getFileCategory('config.json')).toBe('data');
      expect(getFileCategory('data.xml')).toBe('data');
      expect(getFileCategory('config.yaml')).toBe('data');
      expect(getFileCategory('config.yml')).toBe('data');
      expect(getFileCategory('query.sql')).toBe('data');
    });

    it('categorizes document files correctly', () => {
      expect(getFileCategory('README.md')).toBe('document');
      expect(getFileCategory('notes.txt')).toBe('document');
      expect(getFileCategory('app.log')).toBe('document');
    });

    it('categorizes media files correctly', () => {
      expect(getFileCategory('image.png')).toBe('image');
      expect(getFileCategory('photo.jpg')).toBe('image');
      expect(getFileCategory('icon.svg')).toBe('image');
      expect(getFileCategory('video.mp4')).toBe('video');
      expect(getFileCategory('audio.mp3')).toBe('audio');
    });

    it('categorizes archive files correctly', () => {
      expect(getFileCategory('archive.zip')).toBe('archive');
      expect(getFileCategory('backup.tar')).toBe('archive');
      expect(getFileCategory('compressed.gz')).toBe('archive');
    });

    it('returns other for unknown file types', () => {
      expect(getFileCategory('unknown.xyz')).toBe('other');
      expect(getFileCategory('noextension')).toBe('other');
    });
  });
});