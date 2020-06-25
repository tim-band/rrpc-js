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
  function setResult(v) {
    document.getElementById("result").value = v;
  }
  function add(x, y) {
    rrpc.call("add", {x: x, y: y}, setResult);
  }
  function multiply(x, y) {
    rrpc.call("multiply", {x: x, y: y}, setResult);
  }
</script>
```
