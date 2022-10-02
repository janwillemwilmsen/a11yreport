// @ts-checkllll

// const { chromium } = require('playwright');
// const fs = require('fs');
// const { fs, writeFileSync, readFileSync } = require('fs');
// const { createHtmlReport } = require('axe-html-reporter');




import { chromium } from 'playwright';
import { createHtmlReport } from 'axe-html-reporter';
import { readFile, appendFile, writeFile, writeFileSync, readFileSync } from 'fs';
import sanitizeHtml from 'sanitize-html';

// NEEDED for ESM and creating directories + files:
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { argv } from 'process'

import { createRequire } from "module";
const require = createRequire(
    import.meta.url);
const siteListJson = require("./URLS.json");
const config = require("./CONFIG.json");

const mdata = JSON.stringify(config);

// const month = config.filter(x => x.month)
// const year = config.filter(x => x.year)
// console.log(month).stringify()

const mydata = JSON.parse(mdata);
console.log('JAAR:', mydata.year)
console.log('MAAND:', mydata.month)
const month = mydata.month
const year = mydata.year

const textvalues = Object.keys(mydata).map((key) => { mydata });
// const textvalues = Object.keys(mydata).map(function(_) { return mydata[_]; })

// const onlyParams = process.argv.slice(2).toString();
const filter = (process.argv[2])
console.log('FILTER:', filter)
    // console.log('FILTER lenght:', filter.length)

const filterBedrijf = (process.argv[3])
console.log('FILTER site:', filterBedrijf)

if (filter !== undefined) {
    console.log('Filter groter dan 0')

    if (filterBedrijf !== undefined) {

        console.log('Bedrijf groter dan 0')
        var siteList = siteListJson.filter(x => x.cat !== filter && x.url === filterBedrijf)
        var filename = year + '-' + month + '-' + filterBedrijf
        var partialfilename = filterBedrijf
        var seoMeta = filterBedrijf

    } else {
        console.log('alleen categorie')
        var siteList = siteListJson.filter(x => x.cat === filter)
        var filename = year + '-' + month + '-' + filter
        var partialfilename = filter
        var seoMeta = filter

        console.log('config:', config)
        console.log('mdata:', mdata)
        console.log('mydata:', mydata)
        console.log('textvalues', textvalues)

        // var introSeoTxt = textvalues.filter(x => x.filter === filter)
    }

} else {
    console.log('geen params')
    var siteList = siteListJson
    var filename = year + '-' + month + '-all'
    var partialfilename = year + '-' + month + '-all'
    var seoMeta = ' veel websites '
}

console.log(filename)


// console.log('SEO txt:', introSeoTxt)


// const siteList = [

// ];






// console.log(argv)
// console.log(argv('cat')) // NIET
// console.log(argv.cat) // NIET
// console.log(process.argv.cat)
// process.argv('cat')

// Create folder /axe-reports/
const outputDirName = "src/axe-reports"
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(path.join(__dirname, outputDirName));

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Create Folder '/axe-results/json' (for raw json output of the Axe scan)
const jsonFolderName = "json"
const jsonOutputDir = path.resolve(path.join(__dirname, outputDirName + '/' + jsonFolderName));

if (!fs.existsSync(jsonOutputDir)) {
    fs.mkdirSync(jsonOutputDir);
}


// Create Folder '/axe-results/html' (for html output of the Axe scan)
const htmlFolderName = "html"
const htmlOutputDir = path.resolve(path.join(__dirname, outputDirName + '/' + htmlFolderName));

if (!fs.existsSync(htmlOutputDir)) {
    fs.mkdirSync(htmlOutputDir);
}

// Create Folder '/axe-results/partials' (for raw json output of the Axe scan)
const partialFolderName = "partials"
const srcDir = "src"
const partialsDir = path.resolve(path.join(__dirname, srcDir + '/' + partialFolderName));

if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir);
}



const jsonFileExtension = ".json"
const htmlFileExtension = ".html"
const projectKey = "energiebedrijven"




const siteLoop = async() => {
    // (async() => {
    const axeScans = []
    const axeInlineScans = []
    const topMenu = []
    const resultDiv = []

    for (const url of siteList) {



        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext({});

        const page = await context.newPage();

        const BLOCKED_TYPES = ['image', 'font', 'other'];
        // const BLOCKED_TYPES = ['image', 'stylesheet', 'script', 'font', 'other'];
        await page.route('**/*', (route) => {
            BLOCKED_TYPES.includes(route.request().resourceType()) ?
                route.abort() :
                route.continue();
            return;
        });


        const goToUrl = url.site
        const siteName = url.name
        await page.goto(goToUrl);



        try {
            // await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/3.3.2/axe.min.js' });
            // loading script from CDN might give CSP errors.
            // copy file locally. add to head when loading a page:
            await page.addScriptTag({ path: 'axe.min.js' });

        } catch {
            console.log('Error adding script')
        }
        const results = await page.evaluate(() => axe.run(document));

        if (results.violations.length > 0) {
            console.log(`Found ${results.violations.length} accessibility violations`);
            // console.log(results.violations);
        }


        // console.log('res', results);


        // convert url 'slugify' to use as filename 
        const slugify = str =>
            str
            .replace(/[^\w\s-]/g, '')
            .replace(/[\/:]/g, '')
            .replace('-', '');

        const slugDomain = slugify(goToUrl)

        // use date in the filename:
        let date = new Date();
        let myDateTime = (date.getUTCFullYear()) + "-" + (date.getMonth() + 1) + "-" + (date.getUTCDate()) + "-" + (date.getTime());

        // Write results to /json/slugified-url-date.json
        writeFileSync(jsonOutputDir + '/' + slugDomain + '-' + myDateTime + jsonFileExtension, JSON.stringify(results));


        (() => {
            const rawAxeResults = JSON.parse(readFileSync(jsonOutputDir + '/' + slugDomain + '-' + myDateTime + jsonFileExtension, 'utf8'))
            let outputInline = (createHtmlReport({
                results: rawAxeResults,
                //options available to further customize reports
                options: {
                    // projectKey: projectKey, // If you set dynamic value here the number of removed characters at start of string will missmatch..... 
                    // outputDir: outputDirName + '/' + htmlFolderName,
                    // reportFileName: slugDomain + '-axe-' + myDateTime + htmlFileExtension,
                    doNotCreateReportFile: true,
                }
            }))

            // console.log('Single result:', outputInline)

            outputInline = outputInline.substring(2900);
            outputInline = outputInline.substring(0, outputInline.length - 90);
            axeInlineScans.push(outputInline)
                // console.log('All inline Html', axeInlineScans)

            // container${slugDomain}.classList.add("mystyle");
            // Push List Items with output-html with a11y results in Array :
            // + javascript to change the Collapse and Close divs with summary of passes/violations/inapplicable/ results.
            const axeFilename = `
        <li class="relative list-decimal ${slugDomain}">
                    <a id="${slugDomain}"></a>
                    ${outputInline}

                   <script>
                   const container${slugDomain}outer = document.querySelector('li.${slugDomain} #accordionPasses').id = "accordionPasses${slugDomain}";
                   const container${slugDomain}1 = document.querySelector('li.${slugDomain}  #headingOne')
                   container${slugDomain}1.setAttribute('id','headingOne${slugDomain}')
                   const container${slugDomain}11 = document.querySelector('li.${slugDomain}  #headingOne${slugDomain} button')
                   container${slugDomain}11.setAttribute('id','headingOne1${slugDomain}')
                   container${slugDomain}11.setAttribute('data-target','#passes${slugDomain}')
                   container${slugDomain}11.setAttribute('data-toggle','collapse')
                   container${slugDomain}11.setAttribute('aria-controls','collapse${slugDomain}')
                   
                   const container${slugDomain}2 = document.querySelector('li.${slugDomain} #passes')
                   container${slugDomain}2.setAttribute('data-parent','#accordionPasses${slugDomain}')
                   container${slugDomain}2.setAttribute('classsss','collapse${slugDomain}')
                   container${slugDomain}2.id = "passes${slugDomain}";


                   const container${slugDomain}incomplete = document.querySelector('li.${slugDomain} #accordionIncomplete').id = "accordionIncomplete${slugDomain}";
                   const container${slugDomain}butt = document.querySelector('li.${slugDomain}  #headingTwo')
                   container${slugDomain}butt.setAttribute('id','headingTwo${slugDomain}')
                   const container${slugDomain}butt1 = document.querySelector('li.${slugDomain}  #headingTwo${slugDomain} button')
                   container${slugDomain}butt1.setAttribute('data-target','#incomplete${slugDomain}')
                   container${slugDomain}butt1.setAttribute('aria-controls','incomplete${slugDomain}')

                   const container${slugDomain}content = document.querySelector('li.${slugDomain} #incomplete')
                   container${slugDomain}content.setAttribute('data-parent','#accordionIncomplete${slugDomain}')
                   container${slugDomain}content.id = "incomplete${slugDomain}";


                   const container${slugDomain}notapplicable = document.querySelector('li.${slugDomain} #accordionInapplicable').id = "accordionInapplicable${slugDomain}";
                   const container${slugDomain}4 = document.querySelector('li.${slugDomain}  #headingThree')
                   container${slugDomain}4.setAttribute('id','headingThree${slugDomain}')
                   const container${slugDomain}44 = document.querySelector('li.${slugDomain}  #headingThree${slugDomain} button')
                   container${slugDomain}44.setAttribute('data-target','#inapplicable${slugDomain}')
                   container${slugDomain}44.setAttribute('aria-controls','inapplicable${slugDomain}')

                   const container${slugDomain}content4 = document.querySelector('li.${slugDomain} #inapplicable')
                   container${slugDomain}content4.setAttribute('data-parent','#accordionInapplicable${slugDomain}')
                   container${slugDomain}content4.id = "inapplicable${slugDomain}";

                   const removed${slugDomain} = document.querySelector('li.${slugDomain} #rulesSection')
                   removed${slugDomain}.setAttribute('id','rulesSection${slugDomain}')
                   removed${slugDomain}.style.display = "none";


                   const innerremoved${slugDomain} =  document.querySelector('li.${slugDomain} #rulesSection${slugDomain} .card-header')
                   innerremoved${slugDomain}.setAttribute('id','rulesSection${slugDomain}')
                   innerremoved${slugDomain}.style.display = "none";

                   const innerremoved${slugDomain}2 =  document.querySelector('li.${slugDomain} #rulesSection${slugDomain} #rules')
                   innerremoved${slugDomain}2.setAttribute('id','rules${slugDomain}')
                   innerremoved${slugDomain}2.style.display = "none";
                   </script>
        </li>`



            // console.log(axeFilename)
            axeScans.push(axeFilename)

        })(); //// End Axe function

        /// create menu items and push in array
        const menuItem = `
                        <li> 
                        <a href="#${slugDomain}">${siteName}</a>  
                        <!----------Link to ContentAccScan-----------> 
                      
                        <!----a href="view-source:${goToUrl}" target="_blank">${siteName}</a-------->
                        </li>
                        `
        topMenu.push(menuItem)


        // const scoring = `li.${slugDomain} > div > h5 span`

        //// inject html with list or table at bottom of page with summary of all violations....
        const websiteScore = `     <tr class="bg-white border-b">  
                                        <td class="py-4 px-6">
                                            <a href="#${slugDomain}">${siteName}</a>  
                                        </td class="py-4 px-6">
                                        <td class="py-4 px-6">
                                            <span id="score${slugDomain}"></span> 
                                        </td>
                                    </tr>
        
                                <script>
                                 const sitescore${slugDomain} = document.getElementById('score${slugDomain}')
                                 sitescore${slugDomain}.innerText = document.querySelector('li.${slugDomain} > div > h5 span').innerText
                                </script>
                            `

        resultDiv.push(websiteScore)

        // const inline = results
        // axeInlineScans.push(inline)
        // console.log(axeInlineScans)

        await page.close();
        await browser.close();
        // })
    } ////// END FOR LOOP

    // console.log(axeScans)
    const injectedMenu = topMenu.join('');
    const listLinkElements = axeScans.join('');
    const resultForAllSites = resultDiv.join('');
    // const listLinkElements = axeInlineScans

    let date = new Date();
    let myDate = (date.getUTCFullYear()) + "-" + (date.getMonth() + 1) + "-" + (date.getUTCDate());





    // Set HTML and add List items. To create an overview page with links to all the scans. Added Tailwind for some quick styling of the left-menu.
    const html = `<!doctype html>
        <html lang="en">
         <head>
             <title>Axe scans ${seoMeta}</title>
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <meta name="description" content="Bekijk hoe toegankelijk ${seoMeta} url(s)/website(s) zijn.">
             <!--------------script src="https://cdn.tailwindcss.com"></script---------->

             <!-------From Axe HTML reporter template ------>
             <style>
             .violationCard {  width: 100%;margin-bottom: 1rem;}
             .violationCardLine {  display: flex;justify-content: space-between;align-items: start;}
             .learnMore {  margin-bottom: 0.75rem;white-space: nowrap;color: #2557a7;}
             .card-link {  color: #2557a7;}
             .violationNode {  font-size: 0.75rem;}
             .wrapBreakWord {  word-break: break-word;}
             .summary {  font-size: 1rem;}
             .summarySection {  margin: 0.5rem 0;}
             .hljs {  white-space: pre-wrap;width: 100%;background: #f0f0f0;}
             p {  margin-top: 0.3rem;}
             li {  line-height: 1.618;}
             .hljs-string {
                overflow-wrap: break-word!important;
                word-break: break-word;
                /* word-break: break-all!important; */
            }
            a{color:#0068d9!important}
            .btn.btn-link{color:#0068d9!important}
            </style>

        <!-- Bootstrap CSS -->
        <link  rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous"/>
        <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous" async></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous" async></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous" async></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/styles/stackoverflow-light.min.css"/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/highlight.min.js"></script>
        <link rel="icon" href="https://www.deque.com/wp-content/uploads/2018/03/cropped-DQ_SecondaryLogo_HeroBlue_RGB-1-32x32.png" sizes="32x32"/>

         </head>
         <body>
             <div class="flex flex-row">
                 <div class="bg-white px-1">
                    
              
                        <div class="container-fluid">
                            <div class="row">
                                    <div class="col-3">
                                    <div class="px-6 pt-4 h-12 font-semibold font-weight-bold"><a href="/">Axe/A11Y scans</a></div>
                                    <p class="px-6 text-[10px] mb-4 text-gray-500">gemaakt op ${myDate} met Axe-Core 4.4.3</p>

                                                    <ol style="height:80vh;overflow-y: scroll;" class=" p-6 my-2  text-dark sticky-top">
                                                        ${injectedMenu}
                                                        <li  style="list-style:none;"> <a href="#aggregate">Total violations</a> </li>
                                                        </ol>  
                                        </div>
                                        <div class="col-9">

                                        <h2 class="pl-4 pt-4">Toegankelijkheid ${seoMeta} websites/page urls</h2>
                                        <p class="pl-4"></p>

                                                <ol class="relative list-decimal" data-spy="scroll" data-target="#navbar-example2" data-offset="0">
                                                        ${listLinkElements}
                                                </ol>    
                                                <h2>Total violations per url:</h2>
                                                <a name="aggregate"></a>
                                                <div id="ares">

                                                <table class="table w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                                    <thead class="thead-dark text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                        <tr>
                                                        <th scope="col" class="py-3 px-6">Page URL</th>
                                                        <th scope="col" class="py-3 px-6">Accessibility violations ${month}</th>
                                                        
                                                        </tr>
                                                    </thead>
                                                    <tbody>
    
                                                    ${resultForAllSites}
                                                    </tbody>
                                                </table>
                                                </div>
                                                <br><br>
                                        </div>
                                    </div>
                                </div>
                    </div>
             </div>    
             <!------------script>
             const innerTextForIframe = document.getElementById('axeFrame');
             innerTextForIframe.contentDocument.write("Click on a link in the left sidebar to view the Axe html-report. <br><br>Refresh the browser if reports don't load. Some external files used to style the report take some time to load....");
             </script ----------->

             <!-------From Axe HTML reporter template ------>
             <script>
             hljs.initHighlightingOnLoad();
            </script>


         <script>
        // Checkbox Stickynav 
        //  const showDesktop = document.getElementById("des")
        //  showDesktop.addEventListener("click", showHidDesktop);
 
        //  function showHidDesktop() {
        //      const desktopimages = document.querySelectorAll(".desktopImage");
        //      desktopimages.forEach(x => x.classList.toggle('hidden')); 
        //  }
         </script>
         <script>
         const removeAnk = document.querySelectorAll(" th > a.card-link");
         removeAnk.forEach(x => x.removeAttribute("href"));
         </script>

         </body>
         </html>`

    // Write a file with HTML and List Items:
    writeFile(`${outputDir}/${filename}.html`, html, function(err) {
        // writeFile(`${process.cwd()}/${outputDir}/index.html`, html, function(err) {
        if (err) throw err;
        console.log('Index file is created successfully. Open it with Live Server.');
        console.log('File:', `${process.cwd()}/${outputDir}/${filename}.html`)
    });



    // This gets the javascript, not the values.... ughhhh
    // const parcelPartialData = `   ${resultForAllSites} `



    // readFile(`${outputDir}/${filename}.html`, 'utf8', function(err, data) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     console.log(data.filter(val => 'id="rules"'));
    // });


    /// TWEEDE Playwright om data te scrapen van het resultaat.................
    async function main() {
        const browser = await chromium.launch({
            headless: true // setting this to true will not run the UI
        });

        const page = await browser.newPage();
        await page.goto(`${outputDir}/${filename}.html`);
        // const elementToScrape = "//div[@id='ares']"

        // let scrapedData = await page.locator(elementToScrape)
        // let scrapedData = await page.$('#ares');
        // console.log(scrapedData);
        const text = await page.evaluate(() => document.querySelector('#ares').innerHTML);

        const clean = sanitizeHtml(text, {
            allowedTags: ['table', 'thead', 'tr', 'th', 'tbody', 'td'],
            allowedAttributes: {
                'table': ['class'],
                'thead': ['class'],
                'th': ['scope', 'class'],
                'tr': ['class'],
                'td': ['class'],
            },
            allowedIframeHostnames: ['www.youtube.com']
        });

        // console.log(clean);
        // await page.waitForTimeout(5000); // wait for 5 seconds
        await browser.close();

        const linkToDataFile = `<div class="py-3 px-6  bg-gray-50">
                                <a href="./axe-reports/${filename}.html" class="underline">Bekijk data van ${month}</a>
                                </div>
                                <!-- /////////////////////////////////////////////////////////////////////////////// -->
                                `

        const spacer = `<!-- /////////////////////////////////////////////////////////////////////////////// -->`
        const dataForPartial = spacer + clean + linkToDataFile

        appendFile(`${partialsDir}/${partialfilename}.html`, dataForPartial, function(err) {
            // writeFile(`${process.cwd()}/${outputDir}/index.html`, html, function(err) {
            if (err) throw err;
            console.log('Index file is created successfully. Open it with Live Server.');
            console.log('File:', `${process.cwd()}/${partialsDir}/${partialfilename}.html`)
        });

    }

    main();

    // "//th/a[@class="card-link"]"

}

// ();

siteLoop(siteList)


// if (fs.existsSync(jsonOutputDir)) {
//     fs.rmdirSync(jsonOutputDir);
// }