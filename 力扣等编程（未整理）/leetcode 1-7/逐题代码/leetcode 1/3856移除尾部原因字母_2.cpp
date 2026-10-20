//3296!!!
long long minNumberOfSeconds(int mountainHeight, int* workerTimes, int workerTimesSize) {
    long long max=0;
    for (int i=0;i<workerTimesSize;i++) {
        max=workerTimes[i]>max?workerTimes[i]:max;
    }
    long long size=(long long)max*mountainHeight*(mountainHeight+1)/2+1;
    long long left=1,right=size;
    while (left<right) {
        long long mid=left+(right-left)/2;
        long long result=0;
        for (int i=0;i<workerTimesSize;i++) {
            long double tmp = 1.0L + 8.0L * mid / workerTimes[i];
            long long h = (sqrtl(tmp) - 1.0L) / 2.0L;
            
            // 浮点数误差微调
            if (workerTimes[i] * (h + 1) * (h + 2) / 2 <= mid) {
                h++;
            } else if (workerTimes[i] * h * (h + 1) / 2 > mid) {
                h--;
            }
        }
        if (result>=mountainHeight) right=mid;
        else left=mid+1;
    }
    return left;
}
#define EPS 1e-7

long long minNumberOfSeconds(int mountainHeight, int* workerTimes, int workerTimesSize) {
    int maxWorkerTimes = 0;
    for (int i = 0; i < workerTimesSize; i++) {
        if (workerTimes[i] > maxWorkerTimes) {
            maxWorkerTimes = workerTimes[i];
        }
    }
    
    long long l = 1;
    long long r = (long long)maxWorkerTimes * mountainHeight * (mountainHeight + 1) / 2;
    long long ans = 0;
    
    while (l <= r) {
        long long mid = (l + r) / 2;
        long long cnt = 0;
        for (int i = 0; i < workerTimesSize; i++) {
            long long work = mid / workerTimes[i];
            // 求最大的 k 满足 1+2+...+k <= work
            long long k = (long long)((-1.0 + sqrt(1 + work * 8)) / 2 + EPS);
            cnt += k;
        }
        
        if (cnt >= mountainHeight) {
            ans = mid;
            r = mid - 1;
        } else {
            l = mid + 1;
        }
    }
    
    return ans;
}
