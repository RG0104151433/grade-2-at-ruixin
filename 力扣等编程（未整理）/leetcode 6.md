# leetcode 6

## 646最长数对链（仅区间不重叠的可以）（贪心）

```cpp
class Solution {
public:
    int findLongestChain(vector<vector<int>>& pairs) {
        ranges::sort(pairs,{},[](auto& a) {return a[1];});
        int ans=0;
        int pre=INT_MIN;
        for (auto& p:pairs) {
            if (p[0]>pre) {
                ans++;
                pre=p[1];
            }
        }
        return ans;
    }
};//按照右端点排序，任何右端点更靠左的理论上都应该更优先（贪心）
```

## 约瑟夫环：数学倒推

```cpp
class Solution {
public:
    int findTheWinner(int n, int k) {
        int x=0;
        for (int i=2;i<=n;i++) x=(k+x)%i;
        return x+1;
    }
};
```

## 75三颜色分类（插入排序）

```cpp
class Solution {
public:
    void sortColors(vector<int>& nums) {
        int p0=0,p1=0;
        for (int i=0;i<nums.size();i++) {
            int n=nums[i];
            nums[i]=2;
            if (n<=1) nums[p1++]=1;
            if (n==0) nums[p0++]=0;
        }
    }
};
```

## 202按位平方和是否变为1（快慢双指针）

```cpp
class Solution {
public:
    int bitSquareSum(int n) {
        int sum=0;
        while (n>0) {
            int cur=n%10;
            sum+=cur*cur;
            n/=10;
        }
        return sum;
    }
    bool isHappy(int n) {
        int slow=n,fast=n;
        do {
            slow=bitSquareSum(slow);
            fast=bitSquareSum(fast);
            fast=bitSquareSum(fast);
        } while (slow!=fast);
        return slow==1;
    }
};
```

## 287寻找重复数（链表思想快慢双指针）

```cpp
//正确解法：图遍历（链表思路）
class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int n=nums.size();
        int s=0,f=0;
        do {
            s=(s+1)%n;
            f=(f+2)%n;
        } while (nums[s]!=nums[f]);
        return nums[s];
    }
};
//错误解法（线性遍历）
class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int n=nums.size();
        int s=0,f=0;
        do {
            s=(s+1)%n;
            f=(f+2)%n;
        } while (nums[s]!=nums[f]);
        return nums[s];
    }
};
```

## 283将0移到最后

```cpp
class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int p=0;
        for (int& n:nums) {
            if (n) {
                swap(n,nums[p]);
                p++;
            }
        }
    }
};
//一个用来考虑每一个数字
//p用来表示非零数字个数
```

## 125验证回文串（相向双指针）

```cpp
class Solution {
public:
    bool isPalindrome(string s) {
        int i=0,j=s.size();
        while (i<j) {
            if (!isalnum(s[i])) i++;
            else if (!isalnum(s[j])) j--;
            else if (tolower(s[i])==tolower(s[j])) i++,j--;
            else return false;
        }
        return true;
    }
};
```

## 969煎饼排序（每次倒序前k个元素）

```cpp
class Solution {
public:
    vector<int> pancakeSort(vector<int>& arr) {
        vector<int> ans;
        for (int i=arr.size();i>0;i--) {
            int p;
            for (int j=0;j<arr.size();j++) {
                if (arr[j]==i) p=j;
            }
            if (p!=i && p!=0) {//注意条件，如果位置没问题就不用挪了
                reverse(arr.begin(),arr.begin()+p+1);//注意p和i是不一样的起点
                ans.emplace_back(p+1);//所以必须按照位置放，不能按照程序类型放
            }
            reverse(arr.begin(),arr.begin()+i);
            ans.emplace_back(i);
        }
        return ans;
    }
};
//关键思路是从大到小一个一个掰回去
```

## 845山峰中的最长山脉

```cpp
class Solution {
public: 
    int longestMountain(vector<int>& arr) {
        int n=arr.size(),ans=0;
        for (int i=1;i<n-1;) {//注意这种不必定+1.而是视情况+1的类型
            //找到可能的峰顶：严格大于左右
            if (arr[i]>arr[i-1] && arr[i]>arr[i+1]) {
                int left=i-1,right=i+1;
                while (left>0 && arr[left]>arr[left-1]) left--;
                while (right<n-1 && arr[right]>arr[right+1]) right++;
                ans=max(ans,right-left+1);
                i=right;//跳过已处理部分（优化）
            }
            else i++;
        }
        return ans;
    }
};
```

## 881救生艇（相向双指针&贪心）

```cpp
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
```

## 151反转字符串的单词

```cpp
class Solution {
public:
    string reverseWords(string s) {
        reverse(s.begin(),s.end());
        int l=s.size(),idx=0;
        for (int start=0;start<l;start++) {
            if (s[start]!=' ') {//在这里不计数，同时后面通过idx向前修改s截断前面的空格
                if (idx) s[idx++]=' ';//人为添加空格。原本的空格通过向前修改去掉
                int end=start;
                while (end<l && s[end]!=' ') s[idx++]=s[end++];
                reverse(s.begin()+idx-(end-start),s.begin()+idx);//通过两次reverse，先换词间顺序，再调正反
                start=end;
            }
        }
        s.resize(idx);//通过向后截断删去原本的头部空格
        return s;
    }
};
```

## 165比较版本号大小

```cpp
class Solution {
public:
    int compareVersion(string version1, string version2) {
        int v1=0,v2=0,p1=0,p2=0;
        vector<int> n1;
        vector<int> n2;
        while (v1<version1.size()) {
            while (v1<version1.size() && version1[v1]!='.') v1++;
            int c1=0;
            for (int i=p1;i<v1;i++) c1=10*c1+(version1[i]-'0');
            v1++;
            p1=v1;
            n1.emplace_back(c1);
        }
        while (v2<version2.size()) {
            while (v2<version2.size() && version2[v2]!='.') v2++;
            int c2=0;
            for (int i=p2;i<v2;i++) c2=10*c2+(version2[i]-'0');
            v2++;
            p2=v2;
            n2.emplace_back(c2);
        }
        int c1=0,c2=0;
        int l=min(n1.size(),n2.size());
        for (int i=0;i<l;i++) {
            if (n1[i]==n2[i]) continue;
            else if (n1[i]>n2[i]) return 1;
            else return -1;
        }
        if (n1.size()==n2.size()) return 0;
        else if (n1.size()>n2.size()) {
            for (int i=l;i<n1.size();i++) {
                if (n1[i]>0) return 1;
            }
        }
        else {
            for (int i=l;i<n2.size();i++) {
                if (n2[i]>0) return -1;
            }
        }
        return 0;
    }
};
//优化代码：即是比较，不必全部存储
class Solution {
public:
    int compareVersion(string version1, string version2) {
        int i = 0, j = 0;
        int n1 = version1.size(), n2 = version2.size();
        while (i < n1 || j < n2) {
            int num1 = 0;
            while (i < n1 && version1[i] != '.') {
                num1 = num1 * 10 + (version1[i++] - '0');
            }
            i++; // 跳过 '.' 或 i == n1 时自增不会越界（while 已保证）
            int num2 = 0;
            while (j < n2 && version2[j] != '.') {
                num2 = num2 * 10 + (version2[j++] - '0');
            }
            j++;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0; // 所有修订号相等
    }
};
```

## 851喧闹与富有（拓扑排序）

```cpp
//通过richer数组说明前一个比后一个富有，组成一个关系图
//结果输出不必该人穷的人中最吵闹的人的编号
class Solution {
public:
    vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {
        int n=quiet.size();
        vector<vector<int>> g(n);
        vector<int> indeg(n, 0);
        for (auto &e:richer) {
            g[e[0]].push_back(e[1]);
            indeg[e[1]]++;
        }
        queue<int> q;
        vector<int> ans(n);
        for (int i=0;i<n;i++) {
            ans[i]=i;//关键：默认指向自己
            if (indeg[i]==0) q.push(i);
        }
        while (!q.empty()) {
            int u=q.front();
            q.pop();
            for (int v:g[u]) {//u比v有钱，如果u的答案比v当前答案更安静，就更新v
                if (quiet[ans[u]]<quiet[ans[v]]) ans[v]=ans[u];
                if (--indeg[v]==0) q.push(v);
            }
        }
        return ans;
    }
};
```

## 1218最长定差子序列（动态规划）

* 为什么是动态规划？
  * 对于每一个特定输入的结果而言，其结果都受其前驱子序列的和最后一个数的影响
  * 也就是说，对于长为n的输入，结果由长度为n-1的输入和第n位的数字控制，也就是“子问题”
* 如何考虑转移函数？
  * 类似于股票问题，股票问题中，对于每一天有几种不同操作可供选择
  * 这个问题中，由于子序列是可以间断而不改变顺序的，也就是对于每个位置都可以“选”进结果子序列或“不选”
  * 那么，不选该数时，结果直接承袭自前一位；选该数时，则取决于它的前驱数是否存在于它之前，如果不存在为1，存在则+1
* 一些细节见程序中的注释

```cpp
class Solution {
public:
    int longestSubsequence(vector<int>& arr, int difference) {
        int l=arr.size();
        int mx=INT_MIN,mn=INT_MAX;
        for (int i:arr) mx=max(mx,i),mn=min(mn,i);
        vector<int> hash(mx-mn+1,-1);//以最大值为数组大小则要考虑到数组是从0开始的
        vector<vector<int>> dp(2,vector<int> (l,1));
        dp[0][0]=0,dp[1][0]=1;
        int ans=1;
        hash[arr[0]-mn]=0;//要更新第一个位置
        for (int i=1;i<l;i++) {
            dp[0][i]=max(dp[0][i-1],dp[1][i-1]);
            if (arr[i]-difference>=mn && arr[i]-difference<=mx && hash[arr[i]-mn-difference]!=-1) dp[1][i]=dp[1][hash[arr[i]-mn-difference]]+1;//注意直接arr[i]-difference本身不保证结果在mn~mx范围内
            else dp[1][i]=1;
            ans=max({ans,dp[0][i],dp[1][i]});
            hash[arr[i]-mn]=i;//只有顺序处理同时更新hash才能保证只使用到该位置之前的前驱数字
        }
        return ans;
    }
};
```

## 1775使数组和相等的最小操作数

```cpp
//暴力贪心
class Solution {
public:
    int minOperations(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size()!=nums2.size()) {
            if (nums1.size()>nums2.size() && 6*nums2.size()<nums1.size()) return -1;
            if (nums1.size()<nums2.size() && 6*nums1.size()<nums2.size()) return -1;
        }
        int sum1=0,sum2=0;
        for (int i:nums1) sum1+=i;
        for (int i:nums2) sum2+=i;
        if (sum1==sum2) return 0;
        if (sum1>sum2) {
            auto temp=nums1;
            nums1.resize(nums2.size());
            nums1=nums2;
            nums2.resize(temp.size());
            nums2=temp;
        }
        ranges::sort(nums1),ranges::sort(nums2);//不是哥们，真就忘了排序了是吧
        int i=0,j=nums2.size()-1,dif=abs(sum1-sum2),ans=0;
        while (i<nums1.size() && j>=0 && dif>0) {
            int cur=max(abs(6-nums1[i]),abs(nums2[j]-1));
            if (abs(6-nums1[i])>=abs(nums2[j]-1)) i++;
            else j--;
            dif-=cur;
            ans++;
        }
        if (i==nums1.size() && dif>0) {
            while (j>=0 && dif>0) {
                int cur=abs(nums2[j]-1);
                j--;
                dif-=cur;
                ans++;
            }
        }
        else if (j==0 && dif>0) {
            while (i<nums1.size() && dif>0) {
                int cur=abs(6-nums1[i]);
                i++;
                dif-=cur;
                ans++;
            }
        }
        return ans;
    }
};
//解法二：优化，桶计数
class Solution {
public:
    int minOperations(vector<int>& nums1, vector<int>& nums2) {
        int sum1 = accumulate(nums1.begin(), nums1.end(), 0);
        int sum2 = accumulate(nums2.begin(), nums2.end(), 0);

        if (sum1 == sum2) return 0;
        if (sum1 > sum2) {
            swap(nums1, nums2);
            swap(sum1, sum2);   // 保证 sum1 <= sum2
        }

        int n = nums1.size(), m = nums2.size();
        // 不可能的情况：两个数组总和范围没有交集
        if (6 * n < m || 6 * m < n) return -1;

        int diff = sum2 - sum1;          // 需要缩小的差值
        vector<int> cnt1(7, 0), cnt2(7, 0);
        for (int x : nums1) cnt1[x]++;
        for (int x : nums2) cnt2[x]++;

        int ans = 0;
        // 贡献从大到小枚举
        for (int d = 5; d >= 1; --d) {
            // nums1 中数字 6-d 可以增加 d
            int c1 = cnt1[6 - d];
            // nums2 中数字 d+1 可以减小 d
            int c2 = cnt2[d + 1];
            int total = c1 + c2;
            if (total == 0) continue;

            // 需要多少个这样的操作才能把 diff 削到 ≤0
            int need = (diff + d - 1) / d;   // 上取整
            int take = min(total, need);
            ans += take;
            diff -= take * d;
            if (diff <= 0) return ans;
        }
        return -1;   // 理论上不会执行（因为之前已判断可行）
    }
};
```

## 55能到达的位置判断

```cpp
//从头开始，每个位置可以向右跳nums[i]个位置，判断能否跳到最右边
class Solution {
public:
    bool canJump(vector<int>& nums) {
        int k=0,len=nums.size();
        for (int i=0;i<len;i++) {
            if (i>k) return false;
            k=max(k,i+nums[i]);//用k记录能够到达的最右端位置，到不了就false，到了就更新
        }
        return true;
    }
};
```

## 逆波兰表达式求值

```cpp
class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int> stk;
        for (auto& s:tokens) {
            if (s.size()==1 && !isalnum(s[0])) {
                int right=stk.top();
                stk.pop();
                int left=stk.top();
                stk.pop();
                if (s[0]=='+') stk.push(right+left);
                else if (s[0]=='-') stk.push(left-right);
                else if (s[0]=='*') stk.push(right*left);
                else if (s[0]=='/') stk.push(left/right);
            }
            else {
                int num=0;
                for (char c:s) {
                    if (isalnum(c)) num=10*num+(c-'0');
                }
                if (s[0]=='-') num*=-1;
                stk.push(num);
            }
        }
        return stk.top();
    }
};
```

## 单线程CPU处理进程

```cpp
//错误代码
class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        stack<pair<int,int>> stk;
        vector<int> t(n,0);
        for (auto& s:logs) {
            int num=0,time=0;
            bool isnum=true,isstart=true;
            for (char c:s) {
                if (isalnum(c) && isnum) num=10*num+(c-'0');
                if (isalnum(c) && !isnum) time=10*time+(c-'0');
                if (islower(c)) {
                    isnum=false;
                    if (c=='e') isstart=false;
                }
            }//重复造轮子
            if (isstart && (stk.empty() || !stk.empty() && num!=stk.top().first)) {
                int begin=stk.top().second;
                stk.top().second=time-begin+1;
                stk.push({num,time});
            }
            else if (!isstart){
                int begin=stk.top().second;
                stk.top().second=time-begin+1;
            }
            while (!stk.empty()) {
                t[stk.top().first]+=stk.top().second;
                stk.pop();
            }
        }
        return t;
    }
};
//正确代码
class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        vector<int> ans(n, 0);
        stack<int> stk;
        int prev = 0;  // 上一个事件发生的时间

        for (const string& log : logs) {
            // 解析 "id:type:timestamp"
            int p1 = log.find(':');
            int p2 = log.find(':', p1 + 1);

            int id = stoi(log.substr(0, p1));
            string type = log.substr(p1 + 1, p2 - p1 - 1);
            int ts = stoi(log.substr(p2 + 1));

            if (type == "start") {
                // 当前栈顶函数从 prev 执行到 ts
                if (!stk.empty()) {
                    ans[stk.top()] += ts - prev;
                }

                stk.push(id);
                prev = ts;
            } else {
                // 当前结束的函数从 prev 执行到 ts，end 时刻包含在内
                ans[stk.top()] += ts - prev + 1;
                stk.pop();

                prev = ts + 1;
            }
        }

        return ans;
    }
};
```

## 372超级幂运算

```cpp
class Solution {
public:
    int myPow(int a, int cur) {
        int res=a%1337;//注意及时取余
        int result=1;
        while (cur) {//最后操作会变成0
            if (cur==0) return 1;
            if (cur&1) result=(result*res)%1337;
            res=(res*res)%1337;
            cur>>=1;//推到下一个数
        }
        return result;
    }
    int superPow(int a, vector<int>& b) {
        if (b.empty()) return 1;
        int cur=b.back();
        b.pop_back();
        int p=myPow(a,cur);
        int q=myPow(superPow(a,b),10);//递归
        return (p%1337)*(q%1337)%1337;
    }
};
```

## 119杨辉三角2

```cpp
class Solution {
public:
    vector<int> getRow(int rowIndex) {
        vector<int> prev(1,1);
        if (rowIndex==0) return prev;
        for (int i=1;i<=rowIndex;i++) {
            vector<int> cur(i+1,1);
            for (int j=1;j<i;j++) cur[j]=prev[j]+prev[j-1];
            prev=cur;
        }
        return prev;
    }
};
```

​
