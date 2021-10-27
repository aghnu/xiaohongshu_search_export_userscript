no warranty, use at your own risk

# Xiaohongshu Dandelion Query Result Collect and Export Tool
This is a tampermonkey userscript created to collect and export query result from page "https://pgy.xiaohongshu.com/solar/advertiser/patterns/kol". It intercepts ajax response from api "cooperator/blogger/v2" and collects the response body. The tool provides a set of functionalities through its user interface to make this collection process as easy as possible. 

## This tool can be used to...
- Collect information from current query result.
- Export final result as an excel worksheet, this is achieved using sheetJS
- Click on next page automatically, when the current page is being rendered.
- Decrypt cipher text.

## UI showcase
![image](https://user-images.githubusercontent.com/46549455/138980180-3e3d1fc4-d4d6-4c0f-b04d-fbc21eb2cc30.png)

## Demo
![xhs_demo](https://user-images.githubusercontent.com/46549455/138980230-56582931-ce52-47fa-b180-d85d0d0a37e2.png)

## decryption
Xiaohongshu Dandelion is using cookie to encrypt some of its text. The json file returned by their backend contains ciphered text.
To use decryption functionality. User needs to export the first page of the query result with ciphered text and manually matching them to what rendered on the screen.
The "decipher" require user to enter an json containing "cipher to text" key-value pair; number 0 to 9 are required.
Once user have provided with such dictionary. Export to excel will decipher all fields that contains cipher text and then export as an excel worksheet.

## Author
Gengyuan Huang - gengyuan@ualberta.ca
