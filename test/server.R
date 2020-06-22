rrpc <- function(interface) { function(ws) {
  ws$onMessage(function(binary, message) {
    df <- jsonlite::fromJSON(message);
    method <- df$method
    envelope <- list()
    envelope$jsonrpc <- "2.0"
    envelope$id <- df$id
    if (is.null(interface[[method]])) {
      envelope$error <- "no such method"
      envelope$result <- NULL
    } else {
      envelope$result <- do.call(interface[[method]], df$params)
    }
    ws$send(jsonlite::toJSON(envelope))
  })
}}

rrpcServer <- function(interface, host, port, appDir=NULL, root="/") {
  app <- list(onWSOpen=rrpc(interface))
  if (!is.null(appDir)) {
    paths <- list()
    paths[[root]] <- appDir
    app$staticPaths <- paths
  }
  httpuv::startServer(host=host, port=port, app=app)
}

rrpcServer(host='127.0.0.1', port=50056, appDir='.', interface=list(
  add=function(x, y) {
    as.numeric(x) + as.numeric(y)
  },
  multiply=function(x, y) {
    as.numeric(x) * as.numeric(y)
  },
  broken=function(x) {
    stop("broken function called")
  }
))

while (TRUE) {
  later::run_now(9999)
}
