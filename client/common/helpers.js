function traverseAndFlatten(currentNode, target, flattenedKey) {
  for (var key in currentNode) {
    if (currentNode.hasOwnProperty(key)) {
      var newKey;
      if (flattenedKey === undefined) {
        newKey = key;
      } else {
        newKey = flattenedKey + '.' + key;
      }

      var value = currentNode[key];
      if (typeof value === "object") {
        traverseAndFlatten(value, target, newKey);
      } else {
        target[newKey] = value;
      }
    }
  }
}

const flatten = obj => {
  const target = {};
  traverseAndFlatten(obj, target);
  return target;
};

function expand(target) {
  var result = {};
  for (var key in target) {
    if (target.hasOwnProperty(key)) {
      var nestedKeys = key.split('.');
      // Get the last subKey
      var leaf = nestedKeys[nestedKeys.length - 1];
      // Get all subKeys except for the last
      var branch = nestedKeys.slice(0, nestedKeys.length - 1);

      var currentTarget = result;
      for (var i = 0; i < branch.length; i += 1) {
        var subKey = nestedKeys[i];
        // If this is the first time visiting this branch, we need to instantiate it
        if (currentTarget[subKey] === undefined) {
          currentTarget[subKey] = {};
        }
        // Visit the branch
        currentTarget = currentTarget[subKey];
      }
      currentTarget[leaf] = target[key];
    }
  }
  return result;
}

export const applyFlat = (target, flatted) => {
  const flattenTarget = flatten(target);

  for(const [key, value] of Object.entries(flatted)) {
    flattenTarget[key] = value;
  }

  return expand(flattenTarget);
};