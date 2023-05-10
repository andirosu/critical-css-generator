# Critical CSS Generator

This is a simple command-line tool that generates critical CSS for a given set of URLs. It uses Puppeteer to generate screenshots of the above-the-fold content, and then uses Penthouse to extract the critical CSS rules.

## Prerequisites

- Node.js (v14.16.0 or higher)
- Google Chrome (or another Chromium-based browser) installed on your system

## Installation

1. Clone the repository to your local machine: `git clone git@github.com:andirosu/critical-css-generator.git`
2. Navigate to the project directory: `cd critical-css-generator`
3. Install the dependencies: `npm install`

## Usage

To generate critical CSS for a set of URLs, create a JSON file that maps each URL to an output file path, like this:

```json
{
  "https://example.com/": "example.css",
  "https://example.com/about": "about.css",
  "https://example.com/contact": "contact.css"
}
Then, run the generator with the following command:

node critical-css-generator.js urls.json

You can also add the --verbose flag to see detailed logging output
