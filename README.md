# rrpc-js

The browser side of the CRAN R package `rrpc`, allowing you to call
server-side R functions.

If you want to serve static files and R functions you can use the R
code such as the following on the server:

```R
rrpc::rrpcServer(host='127.0.0.1', port=50056, appDir='.', interface=list(
  add=function(x, y) {
    as.numeric(x) + as.numeric(y)
  },
  multiply=function(x, y) {
    as.numeric(x) * as.numeric(y)
  }
))
while (TRUE) {
  later::run_now(9999)
}
```

The client needs the file `rrpc.min.js` (you can download it from this
repo's releases page). Then these R functions can be called like this:

```html
<script src="../dist/rrpc.min.js" type="text/javascript"></script>
<script>
  rrpc.initialize();
  function setResult(v, error, code) {
    document.getElementById("result").value = v;
    if (error) {
      document.getElementById("error").value = error;
    }
  }
  function setProgress(numerator, denominator) {
    var pc = Math.ceil(numerator[0] * 100 / denominator[0]) + "%";
    document.getElementById("progress-bar").style.width = pc;
  }
  function add(x, y) {
    rrpc.call("add", {x: x, y: y}, setResult);
  }
  function multiply(x, y) {
    rrpc.call("multiply", {x: x, y: y}, setResult);
  }
  function doSomethingSlow(x, y) {
    rrpc.call("somethingSlow", {x: x, y: y}, setResult, {
      progress: setProgress
    });
  }
</script>
```

If you use the `code` argument on your error function (the second argument to
`rrpc.call(fn, errorfn)`), it can hold one of a number of integer values depending
on the error type:

| error value | meaning |
| :--- | :--- |
| -1 | web socket failed to reconnect after teardown |
| -32000 | The R function failed |
| -32601 | No such method |
| -32700 | RRPC has failed to construct correct JSON, sorry |

## development

Build the minified JavaScript (as `dist\rrpc.min.js`) with `npm run build`.

Run tests with `npm test`.
