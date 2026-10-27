//1046选两个最大石头的重量，换成其插值直至只剩下一个，求最后一个的重量
class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> pq;
        for (int i=0;i<stones.size();i++) pq.push(stones[i]);
        while (pq.size()>=2) {
            int x=pq.top();
            pq.pop();
            int y=pq.top();
            pq.pop();
            if (x-y>0) pq.push(x-y);
        }
        return pq.size()==0?0:pq.top();
    }
};
//3264经过k次将最小值乘以常数操作后的数组
class Solution {
public:
    vector<int> getFinalState(vector<int>& nums, int k, int multiplier) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> pq;
        for (int i=0;i<nums.size();i++) pq.push({nums[i],i});
        while (k--) {
            auto [val,idx] =pq.top();
            pq.pop();
            nums[idx]=val*multiplier;
            pq.push({nums[idx],idx});
        }
        return nums;
    }
};
//2558经过k次将最大值变为其根值操作后的总数
class Solution {
public:
    long long pickGifts(vector<int>& gifts, int k) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,less<pair<int,int>>> pq;
        for (int i=0;i<gifts.size();i++) pq.push({gifts[i],i});
        while (k--) {
            auto [val,idx] = pq.top();
            gifts[idx]=(int)sqrt(val);
            pq.pop();
            pq.push({gifts[idx],idx});
        }
        long long ans=0;
        for (int i:gifts) ans+=i;
        return ans;
    }
};
//2530执行k次将最大值变为对三除结果上取整并加上该值后的最大结果
class Solution {
public:
    long long maxKelements(vector<int>& nums, int k) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,less<pair<int,int>>> pq;
        long long ans=0LL;
        for (int i=0;i<nums.size();i++) pq.push({nums[i],i});
        while (k--) {
            auto [val,idx]=pq.top();
            pq.pop();
            nums[idx]=(val+2)/3;
            pq.push({nums[idx],idx});
            ans+=val;
        }
        return ans;
    }
};//此法新建数组
class Solution {
public:
    long long maxKelements(vector<int> &nums, int k) {
        make_heap(nums.begin(), nums.end()); // 原地堆化（最大堆）
        long long ans = 0;
        while (k--) {
            pop_heap(nums.begin(), nums.end()); // 把堆顶移到末尾
            ans += nums.back();
            nums.back() = (nums.back() + 2) / 3;
            push_heap(nums.begin(), nums.end()); // 把末尾元素入堆
        }
        return ans;
    }
};//原地堆化 O(1)空间，来自灵神
