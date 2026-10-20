long long minimumTime(int* time, int timeSize, int totalTrips) {
    int min_time=INT_MAX;
    for (int i=0;i<timeSize;i++) {
        min_time=time[i]<min_time?time[i]:min_time;
    }
    long long left=1,right=(long long)totalTrips*min_time;
    while (left<right) {
        long long mid=left+(right-left)/2;
        long long result=0;
        for (int i=0;i<timeSize;i++) {
            result+=mid/time[i];
        }
        if (result>=totalTrips) right=mid;
        else left=mid+1;
    }
    return left;
}
