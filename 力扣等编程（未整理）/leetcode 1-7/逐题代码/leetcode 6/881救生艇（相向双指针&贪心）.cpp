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
