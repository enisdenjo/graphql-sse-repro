function clean_up() {
    echo "Killing stitching $STITCHING_PID and $DGS_PID"
    kill $STITCHING_PID
    kill $DGS_PID
    exit
}

trap clean_up SIGHUP SIGINT SIGTERM

cd graphqlServer
./gradlew compileJava
./gradlew bootRun &
DGS_PID=$!
echo "graphql server PID is $DGS_PID"
sleep 7
cd ../stitching
yarn install && yarn start &
STITCHING_PID=$!
echo "graphql server PID is $STITCHING_PID"

wait
