// 说明：本文件由 `v1-相向双指针.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

//错解
class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        int sum=0,ans=0;
        vector<int> save(people.size(),0);
        ranges::sort(people);
        for (int i=0;i<people.size();i++) {
            if (save[i] || sum==people.size()) continue;
            int j=people.size()-1;
            while (j>i && people[i]+people[j]>limit && save[j]) j--;
            if (i!=j && people[i]+people[j]>limit || i==j && people[i]>limit) break;
            else {
                save[i]=1,save[j]=1;
                sum++,ans++;
            }
        }
        return ans;
    }
};
