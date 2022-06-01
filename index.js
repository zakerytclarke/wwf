const puppeteer = require('puppeteer');
const reader = require("readline-sync");
const sharp = require('sharp');
const cp = require('child_process');

var dimensions=1000;
var boardSize=15;
var boardPath = "board.png";

function run(){
    (async () => {
        const browser = await puppeteer.launch({headless:false});
        const page = await browser.newPage();
        await page.goto('https://wordswithfriends.com/');
        let inTxt = reader.question("Ready?");
      //   await page.screenshot({ path: 'board.png' });
      const elementHandle = await page.waitForSelector('#gameScreen');
      const frame = await elementHandle.contentFrame();
      const boardFrame = await frame.$('#wwf-gameboard');

        await boardFrame.screenshot({'path': boardPath});
        var board = await extractBoard(page);
        var letters=[];
        for(var i=0;i<7;i++){
            var el=await frame.$(`#wwf-letter_${i} > span > span`);
            var letter = await el.getProperty("s5-data_letter");
            
            // var extractedLetter = await letter.getProperty("value");
            
            letters.push(letter);
        }
        printBoard(board,letters);
        console.log(board);
        
        // await browser.close();
      })();
      
      
      
}


// test();
run();

async function test(){
    var board = await extractBoard();
    printBoard(board);
    printBoard(cleanBoard(board));
}


async function extractBoardAndPlay(){
    
}


async function extractBoard(){
    await genereateSlices();
    var board = extractBoardLetters();
    return board
}

async function genereateSlices(){
    var offsetX=4;
    var offsetY=0;

    var image = await sharp(boardPath);
    var image_blank = await sharp("blank_board.png");

    var md = await image.metadata();

    var processedImage = await image
    .extract({ left: offsetX, top: offsetY, width: md.width-offsetX, height: md.height-offsetY })
    .resize(dimensions, dimensions)
    .greyscale()
    // .extractChannel("red")
    

    var processedImageBlank = await image_blank
    .extract({ left: offsetX, top: offsetY, width: md.width-offsetX, height: md.height-offsetY })
    .resize(dimensions, dimensions)
    .toBuffer()
    
    await processedImage
    // .composite([{ 
    //     input: processedImageBlank,
    //     blend: "difference"
    // }])
    // .greyscale()
    // .normalise()
    .blur()
    // .threshold(200)
    .toFile(`./scraped_images/modified.png`);

    for(var i=0;i<boardSize;i++){
        for(var j=0;j<boardSize;j++){
            var l = Math.round(i*(dimensions/boardSize));
            var t = Math.round(j*(dimensions/boardSize));
            var w = Math.round(dimensions/boardSize);
            var h = Math.round(dimensions/boardSize);
    
            sharp("./scraped_images/modified.png")
            .resize(dimensions, dimensions)
            // // .extract({ left: offsetX, top: offsetY, width: md.width-offsetX, height: md.height-offsetY })
            .extract({ left: l, top: t, width: w, height: h })
            .toFile(`./scraped_images/board_${i}_${j}.png`);

        }
    }
}

function extractBoardLetters(){
    var board = [];
    for(var i=0;i<boardSize;i++){
        var temp = [];
        for(var j=0;j<boardSize;j++){
            var letter = cp.execSync(`gocr ./scraped_images/board_${i}_${j}.png`).toString();
            temp.push(parseOCR(letter));
        }
        board.push(temp);
    }
    return transpose(board);
}


function parseOCR(str){
    var workarounds = {
        "o":"O",
        "s":"S",
        " l":"I"
    };

    for(var replacement in workarounds){
        str=str.replaceAll(replacement,workarounds[replacement]);
    }
    return str.replaceAll(/[^A-Z]/g, '').trim()[0]||"";
}

function transpose(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

function printBoard(board,letters){
    board.map(function(row){
        console.log(row.map(function(x){
            if(x==""){
                return " ";
            }else{
                return x;
            }
        }).join("."))
    })
    console.log("");
    // console.log(letters);
}


function cleanBoard(board){
    
    return board;
}