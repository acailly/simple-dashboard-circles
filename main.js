const defaultKey = "0647cd9a908da3ee11a67309d51adab5";
const key = window.location.hash.substr(1) || defaultKey;

const yaml = readYamlFromGist(key);
const data = yamlRootToData(yaml);
draw(data);
renderEditButton(key);

function readYamlFromGist(key) {
  const gist = new XMLHttpRequest();
  gist.open("GET", "https://api.github.com/gists/" + key, false);
  gist.send();
  const response = JSON.parse(gist.responseText)
  const yaml = jsyaml.load(response.files['data.yml'].content);
  return yaml
}

function readYamlFromFile() {
  const file = new XMLHttpRequest();
  file.open("GET", "data.yml", false);
  file.send();
  const yaml = jsyaml.load(file.responseText);
  return yaml
}

function yamlRootToData(root) {
  const firstKey = Object.keys(root)[0];
  return yamlToData(root[firstKey], firstKey);
}

function yamlToData(content, name) {
  const result = {};
  result.name = name;

  if (Array.isArray(content)) {
    result.children = content.map(child => ({
      name: child,
      size: 1
    }));
  } else if (typeof content === "object") {
    const keys = Object.keys(content);
    result.children = keys.map(key => yamlToData(content[key], key));
  } else if (typeof content === "string") {
    result.name += " : " + content; //TODO ACY mettre ca dans un tooltip
    result.size = 1;
  }
  return result;
}

function renderEditButton(key) {
  const linkToGist = document.createElement("a");
  linkToGist.href = "https://gist.github.com/" + key;
  linkToGist.target = "_blank";
  linkToGist.className = "edit-button";
  const linkToSpreadsheetText = document.createTextNode("Edit");
  linkToGist.appendChild(linkToSpreadsheetText);
  document.body.appendChild(linkToGist);
}