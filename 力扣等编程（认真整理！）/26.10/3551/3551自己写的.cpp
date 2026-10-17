class Solution {
public:
    int minSwaps(vector<int>& nums) {
        int len=nums.size();

        // 首先完成数位和计算和排序
        vector<pair<int,int>> a; // 在这里犯了个孩童般的错误：如果初始化了，就不能pushback了
        for (int n:nums) {
            int digitSum=0,i=n;
            while (i>0) {
                digitSum+=i%10;
                i/=10;
            }
            a.push_back({digitSum,n});
        }
        sort(a.begin(),a.end());

        // 大肥鱼给我讲这里用置换环，我觉得这个逻辑是清晰的
        // 似乎以前做过一个情侣的题就是用的这个，可惜我忘了
        // 让我不看大肥鱼试着手写下置换环吧
        int circle=0;
        vector<bool> visited(len,false); // 得明确以下含义：这个visited是指原数组中的下标被处理过了，和后面一致
        unordered_map<int,int> pos;
        for (int i=0;i<len;i++) pos[a[i].second]=i;
        for (int i=0;i<len;i++) { // 从原数组出发
            if (visited[i]) continue;
            circle++;

            // 寄了，我想不到一个我熟悉的数据结构可以做这个事
            // 让我想想要做什么
            /* 首先是得能记录两个数组中的位置
             * 还要和数值绑定？不会了
             */
            // 大肥鱼说用unordered_map，我试试

            int cur=i;
            while (!visited[cur]) {
                visited[cur]=true;
                cur=pos[nums[cur]]; // 往下递推
            }
        }
        return len-circle;
    }
};
