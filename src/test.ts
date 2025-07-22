import { tokenizer } from "./index";


console.log(tokenizer("!(foo || bar) && baz"));
console.log(tokenizer("editorLangId == 'typescript'"));
console.log(tokenizer("resourceExtname != '.js'"));
console.log(tokenizer("gitOpenRepositoryCount >= 1"));
console.log(tokenizer("workspaceFolderCount < 2"));
console.log(tokenizer("resourceScheme =~ /^untitled$|^file$/"));
console.log(tokenizer("resourceFilename in supportedFolders"));
console.log(tokenizer("resourceFilename not in supportedFolders"));
console.log("pause");