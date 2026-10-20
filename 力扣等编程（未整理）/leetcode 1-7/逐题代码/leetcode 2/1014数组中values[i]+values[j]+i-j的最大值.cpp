int maxScoreSightseeingPair(int* values, int valuesSize) {
    int ans=0,max=values[0];
    for (int j=1;j<valuesSize;j++) {
        ans=ans>max+values[j]-j?ans:max+values[j]-j;
        max=max>values[j]+j?max:values[j]+j;
    }
    return ans;
}
//不断枚举右边的j，同时维护左侧i的值。通过将计算方式拆解为i和j方便在每一次枚举时都不断更新，而不需要确定两个值（这样几乎必然进入n^2）
