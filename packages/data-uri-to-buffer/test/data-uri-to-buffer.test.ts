import assert from 'assert';
import dataUriToBuffer from '../src';

describe('data-uri-to-buffer', function () {
	it('should decode bare-bones Data URIs', function () {
		const uri = 'data:,Hello%2C%20World!';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('text/plain;charset=US-ASCII', buf.typeFull);
		assert.equal('US-ASCII', buf.charset);
		assert.equal('Hello, World!', buf.toString());
	});

	it('should decode bare-bones "base64" Data URIs', function () {
		const uri = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('Hello, World!', buf.toString());
	});

	it('should decode plain-text Data URIs', function () {
		const html =
			'<!DOCTYPE html>' +
			'<html lang="en">' +
			'<head><title>Embedded Window</title></head>' +
			'<body><h1>42</h1></body>' +
			'</html>';

		// Escape the HTML for URL formatting
		const uri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

		const buf = dataUriToBuffer(uri);
		assert.equal('text/html', buf.type);
		assert.equal('utf-8', buf.charset);
		assert.equal(html, buf.toString());
	});

	// the next 4 tests are from:
	// https://bug161965.bugzilla.mozilla.org/attachment.cgi?id=94670&action=view

	it('should decode "ISO-8859-8 in Base64" URIs', function () {
		const uri = 'data:text/plain;charset=iso-8859-8-i;base64,+ezl7Q==';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('iso-8859-8-i', buf.charset);
		assert.equal(4, buf.length);
		assert.equal(0xf9, buf[0]);
		assert.equal(0xec, buf[1]);
		assert.equal(0xe5, buf[2]);
		assert.equal(0xed, buf[3]);
	});

	it('should decode "ISO-8859-8 in URL-encoding" URIs', function () {
		const uri = 'data:text/plain;charset=iso-8859-8-i,%f9%ec%e5%ed';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('iso-8859-8-i', buf.charset);
		assert.equal(4, buf.length);
		assert.equal(0xf9, buf[0]);
		assert.equal(0xec, buf[1]);
		assert.equal(0xe5, buf[2]);
		assert.equal(0xed, buf[3]);
	});

	it('should decode "UTF-8 in Base64" URIs', function () {
		const uri = 'data:text/plain;charset=UTF-8;base64,16nXnNeV150=';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('UTF-8', buf.charset);
		assert.equal(8, buf.length);
		assert.equal('שלום', buf.toString('utf8'));
	});

	it('should decode "UTF-8 in URL-encoding" URIs', function () {
		const uri = 'data:text/plain;charset=UTF-8,%d7%a9%d7%9c%d7%95%d7%9d';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('UTF-8', buf.charset);
		assert.equal(8, buf.length);
		assert.equal('שלום', buf.toString('utf8'));
	});

	// this next one is from Wikipedia IIRC

	it('should decode "base64" Data URIs with newlines', function () {
		const uri =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA\n' +
			'AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO\n' +
			'9TXL0Y4OHwAAAABJRU5ErkJggg==';

		const buf = dataUriToBuffer(uri);
		assert.equal('image/png', buf.type);
		assert.equal(
			'iVBORw0KGgoAAAANSUhEUgAAAAUA' +
				'AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO' +
				'9TXL0Y4OHwAAAABJRU5ErkJggg==',
			buf.toString('base64')
		);
	});

	it('should decode a plain-text URI with a space character in it', function () {
		const uri = 'data:,foo bar';

		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('foo bar', buf.toString());
	});

	it('should decode data with a "," comma char', function () {
		const uri = 'data:,a,b';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('a,b', buf.toString());
	});

	it('should decode data with traditionally reserved characters like ";"', function () {
		const uri = 'data:,;test';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal(';test', buf.toString());
	});

	it('should not default to US-ASCII if main type is provided', function () {
		const uri = 'data:text/plain,abc';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('text/plain', buf.typeFull);
		assert.equal('', buf.charset);
		assert.equal('abc', buf.toString());
	});

	it('should default to text/plain if main type is not provided', function () {
		const uri = 'data:;charset=UTF-8,abc';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('text/plain;charset=UTF-8', buf.typeFull);
		assert.equal('UTF-8', buf.charset);
		assert.equal('abc', buf.toString());
	});

	it('should not allow charset without a leading ;', function () {
		const uri = 'data:charset=UTF-8,abc';
		const buf = dataUriToBuffer(uri);
		assert.equal('charset=UTF-8', buf.type);
		assert.equal('charset=UTF-8', buf.typeFull);
		assert.equal('', buf.charset);
		assert.equal('abc', buf.toString());
	});

	it('should allow custom media type parameters', function () {
		const uri = 'data:application/javascript;version=1.8;charset=UTF-8,abc';
		const buf = dataUriToBuffer(uri);
		assert.equal('application/javascript', buf.type);
		assert.equal(
			'application/javascript;version=1.8;charset=UTF-8',
			buf.typeFull
		);
		assert.equal('UTF-8', buf.charset);
		assert.equal('abc', buf.toString());
	});

	it('should allow base64 annotation anywhere', function () {
		const uri = 'data:text/plain;base64;charset=UTF-8,YWJj';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('text/plain;charset=UTF-8', buf.typeFull);
		assert.equal('UTF-8', buf.charset);
		assert.equal('abc', buf.toString());
	});

	it('should parse meta with unnecessary semicolons', function () {
		const uri = 'data:text/plain;;charset=UTF-8;;;base64;;;;,YWJj';
		const buf = dataUriToBuffer(uri);
		assert.equal('text/plain', buf.type);
		assert.equal('text/plain;charset=UTF-8', buf.typeFull);
		assert.equal('UTF-8', buf.charset);
		assert.equal('abc', buf.toString());
	});
});
