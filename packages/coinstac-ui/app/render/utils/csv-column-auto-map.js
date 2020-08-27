import bitap from 'bitap';

function isAMatch(variable, column) {
  let match = false;

  // Match if column and variable are equal
  if (column === variable) {
    match = true;
  }

  // Match if column contains variable and vice versa
  if (!match) {
    if (column.length < variable.length) {
      const sch = variable.replace(/[_-\s]/g, ' ');
      if (sch.includes(column)) {
        match = true;
      }
    } else {
      const str = column.replace(/[_-\s]/gi, ' ');
      if (str.includes(variable)) {
        match = true;
      }
    }
  }

  // Finally Fuzzy match column to variable based on which is larger
  if (!match) {
    let fuzzy = [];
    const str = column.replace(/[_-\s]/gi, '');
    const sch = variable.replace(/[_-\s]/gi, '');
    if (str.length > sch.length) {
      fuzzy = bitap(str, sch, 1);
    } else {
      fuzzy = bitap(sch, str, 1);
    }

    if (fuzzy.length > 1 && fuzzy[0] > 3) {
      match = true;
    }
  }

  return match;
}

function findMatchInVariables(variables, column) {
  const matches = variables.filter((variable) => {
    variable = variable.toLowerCase();
    column = column.toLowerCase();

    return isAMatch(variable, column);
  });

  return matches.length > 0 ? matches[0] : null;
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
