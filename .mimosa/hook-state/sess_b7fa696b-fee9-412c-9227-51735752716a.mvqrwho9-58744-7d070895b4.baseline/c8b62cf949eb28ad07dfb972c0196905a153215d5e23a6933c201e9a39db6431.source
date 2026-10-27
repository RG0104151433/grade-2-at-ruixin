// 说明：本文件由 `v1-相向双指针.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

//正解
class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        ranges::sort(people);
        int i=0,j=people.size()-1,ans=0;
        while (i<=j) {//这里的小于等于号
            if (people[i]+people[j]<=limit) i++;//这里的小于等于号
            j--;//优先上大的，小的看情况
            ans++;
        }
        return ans;
    }
};
