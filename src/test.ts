import { Context, evl, tokenizer } from "./index";



const context = new class implements Context {
    evlExp(expression: String): any {
        // throw new Error("Method not implemented.");
        if(expression === "editorLangId"){
            return "typescript1";
        }
        else if(expression === "resourceScheme"){
            return "untitled";
        }
        return "";
    }
    evlOp(operator: String, left: any, right: any) {
        if (operator === "==" || operator === "===") {
            return left === right
        }
        return false;
        // throw new Error("Method not implemented.");
    }
}

// console.log(tokenizer("!(foo || bar) && baz"));
console.log(evl(tokenizer("editorLangId == 'typescript'"), context));
console.log(evl(tokenizer("resourceExtname != '.js'"), context));
console.log(evl(tokenizer("gitOpenRepositoryCount >= 1"), context));
console.log(evl(tokenizer("workspaceFolderCount < 2"), context));
console.log(evl(tokenizer("resourceScheme =~ /^untitled$|^file$/"), context));
console.log(evl(tokenizer("resourceFilename in supportedFolders"), context));
console.log(evl(tokenizer("resour ceFilename not in supportedFolders"), context));
console.log("pause");