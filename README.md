"# a11yreport" 

# Do not edit axe-html-report template. 

terminal : node run = default, all sites in urls.json.
terminal : node category --> filters urls.json on category (so only insurance websites will be checked)
terminal : node category brand --> filters urls.json on category + brand (so only insurance websites and specific brand will be checked)


## Partials:
install npm i -D posthtml-include (en miss ook posthtml-doctype en  autoprefixer)
add : .posthtmlrc