rrpc::rrpcServer(host='127.0.0.1', port=50056, appDir='.', interface=list(
  add=function(x, y) {
    as.numeric(x) + as.numeric(y)
  },
  multiply=function(x, y) {
    as.numeric(x) * as.numeric(y)
  },
  broken=function(x) {
    stop("broken function called")
  },
  slow=function(x, y) {
    rrpc::sendProgress(0, 100)
    for (i in 1:5) {
      Sys.sleep(0.2)
      rrpc::sendProgress(20*i, 100)
    }
    as.numeric(x) + as.numeric(y)
  },
  text=function(x,y) {
    rrpc::sendInfoText("some information")
    as.numeric(x) * as.numeric(y)
  }
))

while (TRUE) {
  later::run_now(9999)
}
