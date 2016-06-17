<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>COINSTAC API Documentation</title>
    <link rel="stylesheet" href="github-markdown.css">
    <style>
      body {
        padding: 1rem;
      }
    </style>
  </head>
  <body class="markdown-body">
    {{ readme | raw }}
    <a id="api-docs"></a>
    <h3>COINSTAC API Documentation</h3>
    <p>
      COINSTAC is comprised of many libraries to make it great!
      Please use the below links to navigate to package specific API docs.
    </p>

    <ul>
      {% for pkg in packages %}
        <li>
          <section>
            <h3><a href="{{pkg.name}}">{{pkg.name}}</a></h3>
            <p>{{pkg.packageJSON.description}}</p>
          </section>
        </li>
      {% endfor %}
    </ul>
  </body>
</html>
