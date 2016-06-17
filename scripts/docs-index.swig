<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>COINSTAC API Documentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css">
    <style>
      html {
        background: #e9e9e9;
        color: #231f20;
        padding: 1rem;
      }
      /* Content */
      h1 {
        color: #cd9b56;
        font-size: 300%;
        margin: 0 0 1rem;
      }
      a {
        color: #cd9b56;
      }
      /* Message */
      #message {
        color: #fff;
        display: inline-block;
        margin: 0 0 1rem;
        padding: .5rem;
      }
      .error {
        background: #ee5c48;
      }
      .success {
        background: #4bcbea;
      }
      /* Form */
      label {
        display: block;
      }
      input {
        background: #fff;
        border: thin solid #231f20;
        color: inherit;
        padding: .5rem;
      }
      button {
        background: #231f20;
        border: thin solid transparent;
        color: #fff;
        cursor: pointer;
        display: inline-block;
        padding: .5rem;
      }
    </style>
  </head>
  <body>
    <h1>COINSTAC API Documentation</h1>
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
