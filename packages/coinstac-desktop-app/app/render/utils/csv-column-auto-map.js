import bitap from 'bitap';

function isAMatch(variable, column) {
  // Match if column and variable are equal
  if (column === variable) {
    return true;
  }

  // Match if column contains variable and vice versa
  if (column.length < variable.length) {
    const sch = variable.replace(/[_-\s]/g, ' ');
    if (sch.includes(column)) {
      return true;
    }
  } else {
    const str = column.replace(/[_-\s]/gi, ' ');
    if (str.includes(variable)) {
      return true;
    }
  }

  // Finally Fuzzy match column to variable based on which is larger
  let fuzzy = [];
  const str = column.replace(/[_-\s]/gi, '');
  const sch = variable.replace(/[_-\s]/gi, '');
  if (str.length > sch.length) {
    fuzzy = bitap(str, sch, 1);
  } else {
    fuzzy = bitap(sch, str, 1);
  }

  if (fuzzy.length > 1 && fuzzy[0] > 3) {
    return true;
  }

  return false;
}

function findMatchInVariables(variables, column) {
  const matches = variables
    .filter(variable => isAMatch(variable.toLowerCase(), column.toLowerCase()));

  if (matches.length > 0) {
    const exactMatch = matches.find(value => value.toLowerCase() === column.toLowerCase());

    return exactMatch || matches[0];
  }

  return null;
}

function mapVariablesToColumns(variables, columns) {
  const map = [];

  columns.forEach((column) => {
    const match = findMatchInVariables(variables, column);

    if (match) {
      map.push({ variable: match, column });
    }
  });

  return map.length > 0 ? map : null;
}

export default mapVariablesToColumns;
