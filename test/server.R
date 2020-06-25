rrpc::rrpcServer(host='127.0.0.1', port=50056, appDir='.', interface=list(
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
